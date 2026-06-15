import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";

import { handler } from "./handler.mjs";

const ddbMock = mockClient(DynamoDBDocumentClient);

function eventFor(routeKey, { body, claims, id, method = routeKey.split(" ")[0] } = {}) {
  return {
    routeKey,
    rawPath: routeKey.replace(`${method} `, "").replace("{id}", id ?? ""),
    pathParameters: id ? { id } : {},
    requestContext: {
      http: { method },
      authorizer: {
        jwt: {
          claims: claims ?? {
            sub: "user-1",
            email: "player@example.com",
            name: "Player One",
          },
        },
      },
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

function parseBody(response) {
  return response.body ? JSON.parse(response.body) : null;
}

describe("AWS API handler", () => {
  beforeEach(() => {
    process.env.GAMES_TABLE = "games-test";
    ddbMock.reset();
  });

  it("stores games under the authenticated Cognito user, ignoring body ownership", async () => {
    ddbMock.on(PutCommand).resolves({});

    const response = await handler(
      eventFor("PUT /games/{id}", {
        id: "path-game-id",
        body: {
          id: "body-game-id",
          owner_id: "other-user",
          date: "2026-06-15T00:00:00.000Z",
          players: [{ id: 0, name: "Alice" }],
          actions: [],
          completed: true,
          winner_id: 0,
        },
      }),
    );

    expect(response.statusCode).toBe(200);
    expect(parseBody(response).game).toMatchObject({
      id: "path-game-id",
      owner_id: "user-1",
      winner_id: 0,
    });

    const [putCall] = ddbMock.commandCalls(PutCommand);
    expect(putCall.args[0].input.Item).toMatchObject({
      userId: "user-1",
      gameId: "path-game-id",
      players: [{ id: 0, name: "Alice" }],
    });
  });

  it("reads games by authenticated user partition and path game id", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        userId: "user-1",
        gameId: "game-1",
        date: "2026-06-15T00:00:00.000Z",
        players: [],
        actions: [],
        completed: false,
      },
    });

    const response = await handler(eventFor("GET /games/{id}", { id: "game-1" }));

    expect(response.statusCode).toBe(200);
    expect(parseBody(response).game).toMatchObject({
      id: "game-1",
      owner_id: "user-1",
      deleted: false,
    });

    const [getCall] = ddbMock.commandCalls(GetCommand);
    expect(getCall.args[0].input.Key).toEqual({
      userId: "user-1",
      gameId: "game-1",
    });
  });

  it("returns 401 when the authorizer claims do not include a sub", async () => {
    const response = await handler(
      eventFor("GET /games", {
        claims: { email: "player@example.com" },
      }),
    );

    expect(response.statusCode).toBe(401);
    expect(parseBody(response)).toEqual({ error: "missing user sub" });
    expect(ddbMock.calls()).toHaveLength(0);
  });
});
