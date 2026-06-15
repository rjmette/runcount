import {
  deleteGame as deleteGameFromApi,
  getCurrentUser,
  getGame,
  listGames,
  saveGame,
} from '../lib/awsApiClient';

import type { GameBackend } from './types';

export function createAwsBackend(getIdToken: () => Promise<string | null>): GameBackend {
  const requireToken = async () => {
    const token = await getIdToken();
    if (!token) throw new Error('You must be signed in to use cloud sync.');
    return token;
  };

  return {
    async listGames() {
      return listGames(await requireToken());
    },

    async getGame(gameId) {
      return getGame(gameId, await requireToken());
    },

    async saveGame(game) {
      await saveGame(game, await requireToken());
    },

    async deleteGame(gameId) {
      await deleteGameFromApi(gameId, await requireToken());
    },

    async getProfileStats() {
      const currentUser = await getCurrentUser(await requireToken());
      return currentUser.stats;
    },
  };
}
