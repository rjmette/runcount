import { type Player, type GameAction } from '../../../types/game';
import { calculatePlayerStats as calculateSharedPlayerStats } from '../../shared/stats';

export const calculatePlayerStats = (player: Player, actions: GameAction[]) =>
  calculateSharedPlayerStats(player, actions);

export const calculateGameDuration = (actions: GameAction[]): string => {
  if (actions.length === 0) return 'N/A';

  const startTime = new Date(actions[0].timestamp);
  const endTime = new Date(actions[actions.length - 1].timestamp);
  const durationMs = endTime.getTime() - startTime.getTime();
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

export const calculatePointsInInning = (
  actions: GameAction[],
  currentPlayerId: number,
  currentRun: number,
  ballsOnTable: number,
  action: GameAction,
): number => {
  const hasScoreActions = actions.some(
    (a) => a.type === 'score' && a.playerId === currentPlayerId,
  );

  const prevAction = actions.length > 0 ? actions[actions.length - 1] : null;
  const prevBOT = prevAction?.ballsOnTable ?? 15;
  const ballsPocketedOnFinalShot = Math.max(0, prevBOT - (action.ballsOnTable || 0));

  if (action.type === 'foul') {
    return hasScoreActions
      ? ballsPocketedOnFinalShot - 1
      : currentRun + ballsPocketedOnFinalShot - 1;
  }

  return hasScoreActions
    ? ballsPocketedOnFinalShot
    : currentRun + ballsPocketedOnFinalShot;
};
