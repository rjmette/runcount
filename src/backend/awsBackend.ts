import {
  deleteGame as deleteGameFromApi,
  getCurrentUser,
  getGame,
  listGames,
  saveGame,
} from '../lib/awsApiClient';

import type { GameBackend } from './types';

interface AwsBackendAuthActions {
  updateEmail: (email: string) => Promise<void>;
  verifyEmailUpdate: (code: string) => Promise<void>;
  updatePassword?: (currentPassword: string, password: string) => Promise<void>;
}

export function createAwsBackend(
  getIdToken: () => Promise<string | null>,
  authActions?: AwsBackendAuthActions,
): GameBackend {
  const requireToken = async () => {
    const token = await getIdToken();
    if (!token) throw new Error('You must be signed in to use cloud sync.');
    return token;
  };

  const backend: GameBackend = {
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

  if (authActions) {
    backend.updateEmail = async (email) => {
      await authActions.updateEmail(email);
    };

    backend.verifyEmailUpdate = async (code) => {
      await authActions.verifyEmailUpdate(code);
    };
  }

  if (authActions?.updatePassword) {
    backend.updatePassword = async (password, currentPassword) => {
      if (!currentPassword) {
        throw new Error('Enter your current password to change your password.');
      }
      await authActions.updatePassword(currentPassword, password);
    };

    backend.requiresCurrentPasswordForPasswordUpdate = true;
  }

  return backend;
}
