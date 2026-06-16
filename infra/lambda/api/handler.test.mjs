import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handler } from './handler.mjs';

const ddbMock = mockClient(DynamoDBDocumentClient);

function eventFor(
  routeKey,
  { body, claims, id, method = routeKey.split(' ')[0], rawBody } = {},
) {
  return {
    routeKey,
    rawPath: routeKey.replace(`${method} `, '').replace('{id}', id ?? ''),
    pathParameters: id ? { id } : {},
    requestContext: {
      http: { method },
      authorizer: {
        jwt: {
          claims: claims ?? {
            sub: 'user-1',
            email: 'player@example.com',
            name: 'Player One',
          },
        },
      },
    },
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  };
}

function parseBody(response) {
  return response.body ? JSON.parse(response.body) : null;
}

describe('AWS API handler', () => {
  beforeEach(() => {
    process.env.GAMES_TABLE = 'games-test';
    ddbMock.reset();
  });

  it('stores games under the authenticated Cognito user, ignoring body ownership', async () => {
    ddbMock.on(PutCommand).resolves({});

    const response = await handler(
      eventFor('PUT /games/{id}', {
        id: 'path-game-id',
        body: {
          id: 'body-game-id',
          owner_id: 'other-user',
          date: '2026-06-15T00:00:00.000Z',
          players: [{ id: 0, name: 'Alice' }],
          actions: [],
          completed: true,
          winner_id: 0,
        },
      }),
    );

    expect(response.statusCode).toBe(200);
    expect(parseBody(response).game).toMatchObject({
      id: 'path-game-id',
      owner_id: 'user-1',
      winner_id: 0,
    });

    const [putCall] = ddbMock.commandCalls(PutCommand);
    expect(putCall.args[0].input.Item).toMatchObject({
      userId: 'user-1',
      gameId: 'path-game-id',
      players: [{ id: 0, name: 'Alice' }],
    });
  });

  it('reads games by authenticated user partition and path game id', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        userId: 'user-1',
        gameId: 'game-1',
        date: '2026-06-15T00:00:00.000Z',
        players: [],
        actions: [],
        completed: false,
      },
    });

    const response = await handler(eventFor('GET /games/{id}', { id: 'game-1' }));

    expect(response.statusCode).toBe(200);
    expect(parseBody(response).game).toMatchObject({
      id: 'game-1',
      owner_id: 'user-1',
      deleted: false,
    });

    const [getCall] = ddbMock.commandCalls(GetCommand);
    expect(getCall.args[0].input.Key).toEqual({
      userId: 'user-1',
      gameId: 'game-1',
    });
  });

  it('returns 401 when the authorizer claims do not include a sub', async () => {
    const response = await handler(
      eventFor('GET /games', {
        claims: { email: 'player@example.com' },
      }),
    );

    expect(response.statusCode).toBe(401);
    expect(parseBody(response)).toEqual({ error: 'missing user sub' });
    expect(ddbMock.calls()).toHaveLength(0);
  });

  it('paginates game history queries until all active games are returned', async () => {
    const cursor = { userId: 'user-1', gameId: 'cursor-game', dateEpoch: 2 };
    ddbMock
      .on(QueryCommand)
      .resolvesOnce({
        Items: [
          {
            userId: 'user-1',
            gameId: 'game-new',
            date: '2026-06-15T00:00:00.000Z',
            dateEpoch: 2,
            players: [{ id: 0, name: 'Alice' }],
            actions: [],
            completed: true,
          },
        ],
        LastEvaluatedKey: cursor,
      })
      .resolvesOnce({
        Items: [
          {
            userId: 'user-1',
            gameId: 'game-old',
            date: '2026-06-14T00:00:00.000Z',
            dateEpoch: 1,
            players: [{ id: 0, name: 'Alice' }],
            actions: [],
            completed: false,
          },
        ],
      });

    const response = await handler(eventFor('GET /games'));

    expect(response.statusCode).toBe(200);
    expect(parseBody(response).games.map((game) => game.id)).toEqual([
      'game-new',
      'game-old',
    ]);

    const queryCalls = ddbMock.commandCalls(QueryCommand);
    expect(queryCalls).toHaveLength(2);
    expect(queryCalls[1].args[0].input.ExclusiveStartKey).toEqual(cursor);
  });

  it('computes user stats without fetching full game rows', async () => {
    const cursor = { userId: 'user-1', gameId: 'deleted-game', dateEpoch: 3 };
    ddbMock
      .on(QueryCommand)
      .resolvesOnce({ Count: 3 })
      .resolvesOnce({ Items: [], LastEvaluatedKey: cursor })
      .resolvesOnce({
        Items: [
          {
            userId: 'user-1',
            gameId: 'latest-game',
            date: '2026-06-14T00:00:00.000Z',
            dateEpoch: 2,
          },
        ],
      });

    const response = await handler(eventFor('GET /users/me'));

    expect(response.statusCode).toBe(200);
    expect(parseBody(response).stats).toEqual({
      totalGames: 3,
      lastGameDate: '2026-06-14T00:00:00.000Z',
    });

    const queryCalls = ddbMock.commandCalls(QueryCommand);
    expect(queryCalls[0].args[0].input.Select).toBe('COUNT');
    expect(queryCalls[1].args[0].input).toMatchObject({
      Limit: 1,
      ScanIndexForward: false,
    });
    expect(queryCalls[2].args[0].input.ExclusiveStartKey).toEqual(cursor);
  });

  it('soft deletes games with a TTL purge timestamp', async () => {
    const now = new Date('2026-06-15T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    ddbMock.on(GetCommand).resolves({
      Item: {
        userId: 'user-1',
        gameId: 'game-1',
        date: '2026-06-15T00:00:00.000Z',
        players: [],
        actions: [],
        completed: false,
      },
    });
    ddbMock.on(PutCommand).resolves({});

    try {
      const response = await handler(eventFor('DELETE /games/{id}', { id: 'game-1' }));

      expect(response.statusCode).toBe(204);
      const [putCall] = ddbMock.commandCalls(PutCommand);
      expect(putCall.args[0].input.Item).toMatchObject({
        userId: 'user-1',
        gameId: 'game-1',
        deleted: true,
        ttl: Math.floor(now.getTime() / 1000) + 90 * 24 * 60 * 60,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns 400 for malformed JSON game writes', async () => {
    const response = await handler(
      eventFor('PUT /games/{id}', { id: 'game-1', rawBody: '{' }),
    );

    expect(response.statusCode).toBe(400);
    expect(parseBody(response)).toEqual({ error: 'request body must be valid JSON' });
    expect(ddbMock.calls()).toHaveLength(0);
  });

  it('returns 400 when game writes are missing a body', async () => {
    const response = await handler(eventFor('POST /games'));

    expect(response.statusCode).toBe(400);
    expect(parseBody(response)).toEqual({ error: 'request body must be a game object' });
    expect(ddbMock.calls()).toHaveLength(0);
  });
});
