import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION ?? "us-east-1";
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function noContent() {
  return { statusCode: 204, headers: {}, body: "" };
}

function error(statusCode, message) {
  return json(statusCode, { error: message });
}

function envConfig() {
  const gamesTable = process.env.GAMES_TABLE;
  if (!gamesTable) {
    throw new Error("GAMES_TABLE must be set");
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
  if (typeof sub !== "string" || !sub) {
    return null;
  }
  return sub;
}

function gameIdParam(event) {
  return typeof event.pathParameters?.id === "string"
    ? event.pathParameters.id
    : "";
}

function parseJsonBody(event) {
  if (!event.body) return null;
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
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
  if (!body || typeof body !== "object") {
    throw new Error("request body must be a game object");
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
  const out = await ddb.send(
    new QueryCommand({
      TableName: env.gamesTable,
      IndexName: "GamesByDate",
      KeyConditionExpression: "userId = :u",
      FilterExpression: "attribute_not_exists(deleted) OR deleted = :false",
      ExpressionAttributeValues: {
        ":u": userId,
        ":false": false,
      },
      ScanIndexForward: false,
    }),
  );

  return { games: (out.Items ?? []).map(gameFromRow).filter(Boolean) };
}

async function getGame(env, userId, gameId) {
  if (!gameId) return error(400, "game id is required");
  const out = await ddb.send(
    new GetCommand({ TableName: env.gamesTable, Key: { userId, gameId } }),
  );
  const game = gameFromRow(out.Item);
  if (!game || game.deleted) return error(404, "game not found");
  return { game };
}

async function putGame(env, userId, gameId, body) {
  if (!gameId) return error(400, "game id is required");
  const row = rowFromGame(userId, gameId, body);
  await ddb.send(new PutCommand({ TableName: env.gamesTable, Item: row }));
  return { game: gameFromRow(row) };
}

async function postGame(env, userId, body) {
  const gameId = typeof body?.id === "string" && body.id ? body.id : crypto.randomUUID();
  return putGame(env, userId, gameId, body);
}

async function deleteGame(env, userId, gameId) {
  if (!gameId) return error(400, "game id is required");
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
        updatedAt: new Date().toISOString(),
      },
    }),
  );
  return noContent();
}

async function getCurrentUser(env, claims, userId) {
  const games = await listGames(env, userId);
  const lastGame = games.games[0] ?? null;
  return {
    user: {
      userId,
      email: typeof claims.email === "string" ? claims.email : null,
      givenName: typeof claims.given_name === "string" ? claims.given_name : null,
      familyName: typeof claims.family_name === "string" ? claims.family_name : null,
      displayName:
        typeof claims.name === "string"
          ? claims.name
          : typeof claims.email === "string"
            ? claims.email
            : "RunCount user",
    },
    stats: {
      totalGames: games.games.length,
      lastGameDate: lastGame?.date ?? null,
    },
  };
}

async function dispatch(event) {
  const env = envConfig();
  const claims = userClaimsOf(event);
  const userId = userSubOf(claims);
  if (!userId) return error(401, "missing user sub");

  const method = event.requestContext?.http?.method ?? "";
  const routeKey = event.routeKey ?? `${method} ${event.rawPath}`;

  switch (routeKey) {
    case "GET /users/me":
      return getCurrentUser(env, claims, userId);
    case "GET /games":
      return listGames(env, userId);
    case "POST /games":
      return postGame(env, userId, parseJsonBody(event));
    case "GET /games/{id}":
      return getGame(env, userId, gameIdParam(event));
    case "PUT /games/{id}":
      return putGame(env, userId, gameIdParam(event), parseJsonBody(event));
    case "DELETE /games/{id}":
      return deleteGame(env, userId, gameIdParam(event));
    default:
      return error(404, `No route for ${routeKey}`);
  }
}

export async function handler(event) {
  try {
    const result = await dispatch(event);
    if (result && typeof result.statusCode === "number") return result;
    return json(200, result);
  } catch (e) {
    console.error("api error", e);
    return error(500, e instanceof Error ? e.message : "Internal server error");
  }
}
