import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION ?? 'us-east-1';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const ACTIVE_GAME_FILTER = 'attribute_not_exists(deleted) OR deleted = :false';
const SOFT_DELETE_TTL_SECONDS = 90 * 24 * 60 * 60;
const MAX_BODY_BYTES = 512 * 1024;
const MAX_PLAYERS = 16;
const MAX_ACTIONS = 50_000;
const INVALID_JSON = Symbol('invalid-json');
const OVERSIZED_BODY = Symbol('oversized-body');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function noContent() {
  return { statusCode: 204, headers: {}, body: '' };
}

function error(statusCode, message) {
  return json(statusCode, { error: message });
}

function envConfig() {
  const gamesTable = process.env.GAMES_TABLE;
  if (!gamesTable) {
    throw new Error('GAMES_TABLE must be set');
  }
  return { gamesTable };
}

function userClaimsOf(event) {
  return (
    event.requestContext?.authorizer?.jwt?.claims ??
    event.requestContext?.authorizer?.claims ??
    {}
  );
}

function userSubOf(claims) {
  const sub = claims?.sub;
  if (typeof sub !== 'string' || !sub) {
    return null;
  }
  return sub;
}

function gameIdParam(event) {
  return typeof event.pathParameters?.id === 'string' ? event.pathParameters.id : '';
}

function parseJsonBody(event) {
  if (!event.body) return null;
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  if (!raw.trim()) return null;
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return OVERSIZED_BODY;
  try {
    return JSON.parse(raw);
  } catch {
    return INVALID_JSON;
  }
}

function dateEpochOf(value) {
  const ms = new Date(value ?? Date.now()).getTime();
  return Number.isFinite(ms) ? ms : Date.now();
}

function gameFromRow(row) {
  if (!row) return null;
  return {
    id: row.gameId,
    date: row.date,
    players: row.players ?? [],
    actions: row.actions ?? [],
    completed: !!row.completed,
    winner_id: row.winner_id ?? null,
    owner_id: row.userId,
    deleted: !!row.deleted,
    startTime: row.startTime,
    endTime: row.endTime,
    turnStartTime: row.turnStartTime,
  };
}

function rowFromGame(userId, gameId, body) {
  if (!body || typeof body !== 'object') {
    throw new Error('request body must be a game object');
  }
  if (body.players !== undefined && !Array.isArray(body.players)) {
    throw new Error('players must be an array');
  }
  if (Array.isArray(body.players) && body.players.length > MAX_PLAYERS) {
    throw new Error(`players exceeds the maximum of ${MAX_PLAYERS}`);
  }
  if (body.actions !== undefined && !Array.isArray(body.actions)) {
    throw new Error('actions must be an array');
  }
  if (Array.isArray(body.actions) && body.actions.length > MAX_ACTIONS) {
    throw new Error(`actions exceeds the maximum of ${MAX_ACTIONS}`);
  }
  const date = body.date ?? new Date().toISOString();
  const now = new Date().toISOString();
  return {
    userId,
    gameId,
    date,
    dateEpoch: dateEpochOf(date),
    players: Array.isArray(body.players) ? body.players : [],
    actions: Array.isArray(body.actions) ? body.actions : [],
    completed: !!body.completed,
    winner_id: body.winner_id ?? null,
    deleted: !!body.deleted,
    startTime: body.startTime ?? null,
    endTime: body.endTime ?? null,
    turnStartTime: body.turnStartTime ?? null,
    createdAt: body.createdAt ?? now,
    updatedAt: now,
  };
}

async function listGames(env, userId) {
  const items = [];
  let lastEvaluatedKey;

  do {
    const out = await ddb.send(
      new QueryCommand({
        TableName: env.gamesTable,
        IndexName: 'GamesByDate',
        KeyConditionExpression: 'userId = :u',
        FilterExpression: ACTIVE_GAME_FILTER,
        ExpressionAttributeValues: {
          ':u': userId,
          ':false': false,
        },
        ScanIndexForward: false,
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );
    items.push(...(out.Items ?? []));
    lastEvaluatedKey = out.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return { games: items.map(gameFromRow).filter(Boolean) };
}

async function countActiveGames(env, userId) {
  let totalGames = 0;
  let lastEvaluatedKey;

  do {
    const out = await ddb.send(
      new QueryCommand({
        TableName: env.gamesTable,
        IndexName: 'GamesByDate',
        KeyConditionExpression: 'userId = :u',
        FilterExpression: ACTIVE_GAME_FILTER,
        ExpressionAttributeValues: {
          ':u': userId,
          ':false': false,
        },
        Select: 'COUNT',
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );
    totalGames += out.Count ?? 0;
    lastEvaluatedKey = out.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return totalGames;
}

async function latestActiveGame(env, userId) {
  let lastEvaluatedKey;

  do {
    const out = await ddb.send(
      new QueryCommand({
        TableName: env.gamesTable,
        IndexName: 'GamesByDate',
        KeyConditionExpression: 'userId = :u',
        FilterExpression: ACTIVE_GAME_FILTER,
        ExpressionAttributeValues: {
          ':u': userId,
          ':false': false,
        },
        ProjectionExpression: 'gameId, userId, #date, dateEpoch, deleted',
        ExpressionAttributeNames: {
          '#date': 'date',
        },
        ScanIndexForward: false,
        Limit: 1,
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );
    const [item] = out.Items ?? [];
    if (item) return item;
    lastEvaluatedKey = out.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return null;
}

async function getGame(env, userId, gameId) {
  if (!gameId) return error(400, 'game id is required');
  const out = await ddb.send(
    new GetCommand({ TableName: env.gamesTable, Key: { userId, gameId } }),
  );
  const game = gameFromRow(out.Item);
  if (!game || game.deleted) return error(404, 'game not found');
  return { game };
}

async function putGame(env, userId, gameId, body) {
  if (!gameId) return error(400, 'game id is required');
  let row;
  try {
    row = rowFromGame(userId, gameId, body);
  } catch (e) {
    return error(400, e instanceof Error ? e.message : 'request body is invalid');
  }
  await ddb.send(new PutCommand({ TableName: env.gamesTable, Item: row }));
  return { game: gameFromRow(row) };
}

async function postGame(env, userId, body) {
  const gameId = typeof body?.id === 'string' && body.id ? body.id : crypto.randomUUID();
  return putGame(env, userId, gameId, body);
}

async function deleteGame(env, userId, gameId) {
  if (!gameId) return error(400, 'game id is required');
  const existing = await ddb.send(
    new GetCommand({ TableName: env.gamesTable, Key: { userId, gameId } }),
  );
  if (!existing.Item) return noContent();

  await ddb.send(
    new PutCommand({
      TableName: env.gamesTable,
      Item: {
        ...existing.Item,
        deleted: true,
        ttl: Math.floor(Date.now() / 1000) + SOFT_DELETE_TTL_SECONDS,
        updatedAt: new Date().toISOString(),
      },
    }),
  );
  return noContent();
}

async function getCurrentUser(env, claims, userId) {
  const [totalGames, lastGame] = await Promise.all([
    countActiveGames(env, userId),
    latestActiveGame(env, userId),
  ]);
  return {
    user: {
      userId,
      email: typeof claims.email === 'string' ? claims.email : null,
      givenName: typeof claims.given_name === 'string' ? claims.given_name : null,
      familyName: typeof claims.family_name === 'string' ? claims.family_name : null,
      displayName:
        typeof claims.name === 'string'
          ? claims.name
          : typeof claims.email === 'string'
            ? claims.email
            : 'RunCount user',
    },
    stats: {
      totalGames,
      lastGameDate: lastGame?.date ?? null,
    },
  };
}

async function dispatch(event) {
  const env = envConfig();
  const claims = userClaimsOf(event);
  const userId = userSubOf(claims);
  if (!userId) return error(401, 'missing user sub');

  const method = event.requestContext?.http?.method ?? '';
  const routeKey = event.routeKey ?? `${method} ${event.rawPath}`;

  switch (routeKey) {
    case 'GET /users/me':
      return getCurrentUser(env, claims, userId);
    case 'GET /games':
      return listGames(env, userId);
    case 'POST /games': {
      const body = parseJsonBody(event);
      if (body === OVERSIZED_BODY) return error(413, 'request body is too large');
      if (body === INVALID_JSON) return error(400, 'request body must be valid JSON');
      return postGame(env, userId, body);
    }
    case 'GET /games/{id}':
      return getGame(env, userId, gameIdParam(event));
    case 'PUT /games/{id}': {
      const body = parseJsonBody(event);
      if (body === OVERSIZED_BODY) return error(413, 'request body is too large');
      if (body === INVALID_JSON) return error(400, 'request body must be valid JSON');
      return putGame(env, userId, gameIdParam(event), body);
    }
    case 'DELETE /games/{id}':
      return deleteGame(env, userId, gameIdParam(event));
    default:
      return error(404, `No route for ${routeKey}`);
  }
}

export async function handler(event) {
  try {
    const result = await dispatch(event);
    if (result && typeof result.statusCode === 'number') return result;
    return json(200, result);
  } catch (e) {
    console.error('api error', e);
    return error(500, e instanceof Error ? e.message : 'Internal server error');
  }
}
