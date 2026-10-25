import { sortByWinnerFirst } from '../components/GameSummary/metrics';
import { type GameData } from '../types/game';

import { computeMatchLength } from './computeMatchLength';
import { formatGameDateLong } from './formatGameDate';

/**
 * Plain-text match summary for the clipboard/"share via email" flow.
 *
 * Previously duplicated near-identically in GameStatistics and
 * GameHistory/GameDetails; hoisted here so the single GameSummary screen has
 * one copy source of truth. Player order matches the summary screen via
 * sortByWinnerFirst.
 */
export const formatMatchResults = (game: GameData): string => {
  const matchLength = computeMatchLength(game);
  const sortedPlayers = sortByWinnerFirst(game.players, game.winner_id);

  let emailText = `${formatGameDateLong(game.date)}\n`;
  emailText += `Length: ${matchLength}\n\n`;

  sortedPlayers.forEach((player) => {
    emailText += `${player.name}${player.id === game.winner_id ? ' (Winner)' : ''}\n`;
    emailText += `Score: ${player.score}\n`;
    emailText += `Target: ${player.targetScore}\n`;
    emailText += `High Run: ${player.highRun}\n\n`;
  });

  return emailText;
};
