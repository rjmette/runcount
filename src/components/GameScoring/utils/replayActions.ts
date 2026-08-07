import { type GameAction, type Player } from '../../../types/game';

const THREE_FOUL_PENALTY = 15;

interface ReplayActionsParams {
  players: string[];
  playerTargetScores: Record<string, number>;
  breakingPlayerId: number;
  actions: GameAction[];
}

interface ReplayedGameState {
  playerData: Player[];
  activePlayerIndex: number;
  currentInning: number;
  ballsOnTable: number;
  currentRun: number;
  playerNeedsReBreak: number | null;
}

const resolveNextTableState = (ballsOnTable: number) =>
  ballsOnTable === 0 ? 15 : ballsOnTable;

const createInitialPlayerData = (
  players: string[],
  playerTargetScores: Record<string, number>,
  breakingPlayerId: number,
): Player[] =>
  players.map((name, index) => ({
    id: index,
    name,
    score: 0,
    innings: index === breakingPlayerId ? 1 : 0,
    highRun: 0,
    fouls: 0,
    consecutiveFouls: 0,
    safeties: 0,
    missedShots: 0,
    targetScore: playerTargetScores[name] || 100,
  }));

export const replayActions = ({
  players,
  playerTargetScores,
  breakingPlayerId,
  actions,
}: ReplayActionsParams): ReplayedGameState => {
  const playerData = createInitialPlayerData(
    players,
    playerTargetScores,
    breakingPlayerId,
  );
  let currentInning = 1;
  let activePlayerIndex = breakingPlayerId;
  let ballsOnTable = 15;
  let currentRun = 0;
  let playerNeedsReBreak: number | null = null;

  const updateHighRun = (playerIndex: number) => {
    if (currentRun > playerData[playerIndex].highRun) {
      playerData[playerIndex].highRun = currentRun;
    }
  };

  const applyPocketedBalls = (action: GameAction, playerIndex: number) => {
    if (action.ballsOnTable === undefined) return 0;

    const ballsPocketed = Math.max(0, ballsOnTable - action.ballsOnTable);
    playerData[playerIndex].score += ballsPocketed;
    currentRun += ballsPocketed;
    updateHighRun(playerIndex);
    ballsOnTable = resolveNextTableState(action.ballsOnTable);
    return ballsPocketed;
  };

  const advanceTurn = (playerIndex: number) => {
    activePlayerIndex = (playerIndex + 1) % playerData.length;
    if (activePlayerIndex === 0) {
      currentInning += 1;
    }
    playerData[activePlayerIndex].innings += 1;
  };

  for (const action of actions) {
    const playerIndex = playerData.findIndex((player) => player.id === action.playerId);
    if (playerIndex === -1) continue;

    activePlayerIndex = playerIndex;

    switch (action.type) {
      case 'score':
        if (playerNeedsReBreak === action.playerId) {
          playerNeedsReBreak = null;
        }
        playerData[playerIndex].score += action.value;
        playerData[playerIndex].consecutiveFouls = 0;
        currentRun += action.value;
        updateHighRun(playerIndex);
        if (action.ballsOnTable !== undefined) {
          ballsOnTable = resolveNextTableState(action.ballsOnTable);
        }
        break;

      case 'foul': {
        const ballsPocketed = applyPocketedBalls(action, playerIndex);

        playerData[playerIndex].fouls += 1;

        const isTwoPointBreakingFoul = action.isBreakFoul === true && action.value === -2;

        if (!isTwoPointBreakingFoul) {
          playerData[playerIndex].consecutiveFouls =
            ballsPocketed > 0 ? 1 : playerData[playerIndex].consecutiveFouls + 1;
        }

        playerData[playerIndex].score += action.value;

        if (action.reBreak) {
          playerData[playerIndex].score -= THREE_FOUL_PENALTY;
          playerData[playerIndex].consecutiveFouls = 0;
          ballsOnTable = 15;
          playerNeedsReBreak = action.playerId;
        } else {
          if (!isTwoPointBreakingFoul && playerData[playerIndex].consecutiveFouls >= 3) {
            playerData[playerIndex].consecutiveFouls = 1;
          }

          if (!action.isBreakFoul) {
            advanceTurn(playerIndex);
          }
        }

        currentRun = 0;
        break;
      }

      case 'safety':
      case 'miss':
        if (playerNeedsReBreak === action.playerId) {
          playerNeedsReBreak = null;
        }
        applyPocketedBalls(action, playerIndex);

        if (action.type === 'safety') {
          playerData[playerIndex].safeties += 1;
        } else {
          playerData[playerIndex].missedShots += 1;
        }

        playerData[playerIndex].consecutiveFouls = 0;
        advanceTurn(playerIndex);
        currentRun = 0;
        break;
    }
  }

  return {
    playerData,
    activePlayerIndex,
    currentInning,
    ballsOnTable,
    currentRun,
    playerNeedsReBreak,
  };
};
