import { type GameAction, type Player } from '../../types/game';

import { type PlayerStats } from './types';

export const calculatePlayerStats = (
  player: Player,
  actions: GameAction[],
): PlayerStats => {
  let successfulSafeties = 0;
  let failedSafeties = 0;
  let safetyInnings = 0;

  actions.forEach((action, index) => {
    if (action.type !== 'safety' || action.playerId !== player.id) {
      return;
    }

    safetyInnings++;

    const nextAction = actions[index + 1];
    if (!nextAction || nextAction.playerId === player.id) {
      return;
    }

    if (nextAction.type === 'foul' || nextAction.type === 'miss') {
      successfulSafeties++;
      return;
    }

    failedSafeties++;
  });

  const safetyEfficiency =
    player.safeties > 0 ? Math.round((successfulSafeties / player.safeties) * 100) : 0;
  const offensiveInnings = Math.max(1, player.innings - safetyInnings);
  const shotsTaken = player.score + player.missedShots + player.safeties + player.fouls;
  const shootingPercentage =
    shotsTaken > 0 ? Math.round((player.score / shotsTaken) * 100) : 0;

  return {
    bpi: player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00',
    offensiveBPI: (player.score / offensiveInnings).toFixed(2),
    safetyEfficiency,
    shootingPercentage,
    successfulSafeties,
    failedSafeties,
  };
};
