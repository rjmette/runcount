import { useRef, useState } from 'react';

import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { useGameActions } from '../useGameActions';

import type { GameAction, Player } from '../../../../types/game';
import type { Mock } from 'vitest';

interface SimulationState {
  actions: GameAction[];
  activePlayerIndex: number;
  alertMessage: string;
  ballsOnTable: number;
  currentInning: number;
  currentRun: number;
  gameWinner: Player | null;
  isEndGameModalOpen: boolean;
  isUndoEnabled: boolean;
  matchEndTime: Date | null;
  playerData: Player[];
  playerNeedsReBreak: number | null;
  turnStartTime: Date | null;
}

interface SimulationHarness {
  handleAddScore: ReturnType<typeof useGameActions>['handleAddScore'];
  handleAddFoul: ReturnType<typeof useGameActions>['handleAddFoul'];
  handleAddSafety: ReturnType<typeof useGameActions>['handleAddSafety'];
  handleAddMiss: ReturnType<typeof useGameActions>['handleAddMiss'];
  saveGameToSupabase: Mock;
  state: SimulationState;
}

type SimulatedActionType = 'score' | 'foul' | 'safety' | 'miss';

const targetScore = 40;

const createPlayers = (): Player[] => [
  {
    id: 0,
    name: 'Alice',
    score: 0,
    innings: 1,
    highRun: 0,
    fouls: 0,
    consecutiveFouls: 0,
    safeties: 0,
    missedShots: 0,
    targetScore,
  },
  {
    id: 1,
    name: 'Bob',
    score: 0,
    innings: 0,
    highRun: 0,
    fouls: 0,
    consecutiveFouls: 0,
    safeties: 0,
    missedShots: 0,
    targetScore,
  },
];

const createRandom = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
};

const randomInt = (random: () => number, min: number, max: number) =>
  Math.floor(random() * (max - min + 1)) + min;

const chooseActionType = (
  random: () => number,
  state: SimulationState,
): SimulatedActionType => {
  const activePlayer = state.playerData[state.activePlayerIndex];

  if (state.actions.length === 0 || state.playerNeedsReBreak === activePlayer.id) {
    return random() < 0.7 ? 'score' : 'miss';
  }

  const roll = random();
  if (roll < 0.62) return 'score';
  if (roll < 0.76) return 'safety';
  if (roll < 0.9) return 'miss';
  return 'foul';
};

const chooseBallsRemaining = (
  random: () => number,
  ballsOnTable: number,
  preferredPocketed?: number,
) => {
  const pocketed = preferredPocketed ?? randomInt(random, 0, Math.max(0, ballsOnTable));

  return Math.max(0, ballsOnTable - Math.min(pocketed, ballsOnTable));
};

const useSimulationHarness = (): SimulationHarness => {
  const [playerData, setPlayerData] = useState<Player[]>(() => createPlayers());
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [currentRun, setCurrentRun] = useState(0);
  const [ballsOnTable, setBallsOnTable] = useState(15);
  const [actions, setActions] = useState<GameAction[]>([]);
  const [currentInning, setCurrentInning] = useState(1);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);
  const [isEndGameModalOpen, setShowEndGameModal] = useState(false);
  const [playerNeedsReBreak, setPlayerNeedsReBreak] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [isUndoEnabled, setIsUndoEnabled] = useState(false);
  const [matchEndTime, setMatchEndTime] = useState<Date | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<Date | null>(new Date());
  const saveGameToSupabase = useRef(vi.fn()).current;

  const handlers = useGameActions({
    playerData,
    activePlayerIndex,
    currentRun,
    ballsOnTable,
    actions,
    gameId: 'simulation-game',
    currentInning,
    saveGameToSupabase,
    setPlayerData,
    setActions,
    setBallsOnTable,
    setCurrentRun,
    setActivePlayerIndex,
    setTurnStartTime,
    setCurrentInning,
    setGameWinner,
    setShowEndGameModal,
    setPlayerNeedsReBreak,
    setShowAlertModal: vi.fn(),
    setAlertMessage,
    setIsUndoEnabled,
    playerNeedsReBreak,
    setMatchEndTime,
  });

  return {
    ...handlers,
    saveGameToSupabase,
    state: {
      actions,
      activePlayerIndex,
      alertMessage,
      ballsOnTable,
      currentInning,
      currentRun,
      gameWinner,
      isEndGameModalOpen,
      isUndoEnabled,
      matchEndTime,
      playerData,
      playerNeedsReBreak,
      turnStartTime,
    },
  };
};

const assertSimulationInvariants = (harness: SimulationHarness) => {
  const { state } = harness;
  const playerIds = new Set(state.playerData.map((player) => player.id));

  expect(state.activePlayerIndex).toBeGreaterThanOrEqual(0);
  expect(state.activePlayerIndex).toBeLessThan(state.playerData.length);
  expect(state.ballsOnTable).toBeGreaterThanOrEqual(1);
  expect(state.ballsOnTable).toBeLessThanOrEqual(15);
  expect(state.currentInning).toBeGreaterThanOrEqual(1);
  expect(state.currentRun).toBeGreaterThanOrEqual(0);
  expect(harness.saveGameToSupabase).toHaveBeenCalledTimes(state.actions.length);

  state.actions.forEach((action) => {
    expect(playerIds.has(action.playerId)).toBe(true);
    expect(action.ballsOnTable).toBeGreaterThanOrEqual(0);
    expect(action.ballsOnTable).toBeLessThanOrEqual(15);
  });

  state.playerData.forEach((player) => {
    expect(player.innings).toBeGreaterThanOrEqual(0);
    expect(player.highRun).toBeGreaterThanOrEqual(0);
    expect(player.fouls).toBe(
      state.actions.filter(
        (action) => action.playerId === player.id && action.type === 'foul',
      ).length,
    );
    expect(player.safeties).toBe(
      state.actions.filter(
        (action) => action.playerId === player.id && action.type === 'safety',
      ).length,
    );
    expect(player.missedShots).toBe(
      state.actions.filter(
        (action) => action.playerId === player.id && action.type === 'miss',
      ).length,
    );
    expect(player.consecutiveFouls).toBeGreaterThanOrEqual(0);
    expect(player.consecutiveFouls).toBeLessThanOrEqual(2);
  });

  if (state.gameWinner) {
    expect(state.gameWinner.score).toBeGreaterThanOrEqual(state.gameWinner.targetScore);
    expect(state.isEndGameModalOpen).toBe(true);
    expect(state.matchEndTime).toBeInstanceOf(Date);

    const lastSaveCall = harness.saveGameToSupabase.mock.lastCall;
    expect(lastSaveCall).toBeDefined();
    expect(lastSaveCall?.[3]).toBe(true);
    expect(lastSaveCall?.[4]).toBe(state.gameWinner.id);
  } else {
    expect(state.playerData.every((player) => player.score < player.targetScore)).toBe(
      true,
    );
  }
};

describe('useGameActions generated simulations', () => {
  test('simulates 100 deterministic games through the real action handlers', () => {
    const gameCount = 100;

    for (let gameIndex = 0; gameIndex < gameCount; gameIndex += 1) {
      const random = createRandom(gameIndex + 1);
      const { result } = renderHook(() => useSimulationHarness());

      for (let actionIndex = 0; actionIndex < 160; actionIndex += 1) {
        if (result.current.state.gameWinner) break;

        const activePlayer =
          result.current.state.playerData[result.current.state.activePlayerIndex];
        const pointsNeeded = activePlayer.targetScore - activePlayer.score;
        const canWinWithScore =
          pointsNeeded > 0 && pointsNeeded <= result.current.state.ballsOnTable;
        const actionType = canWinWithScore
          ? 'score'
          : chooseActionType(random, result.current.state);
        const ballsRemaining = chooseBallsRemaining(
          random,
          result.current.state.ballsOnTable,
          canWinWithScore ? pointsNeeded : undefined,
        );

        act(() => {
          if (actionType === 'score') {
            result.current.handleAddScore(0, ballsRemaining);
          } else if (actionType === 'foul') {
            result.current.handleAddFoul(ballsRemaining);
          } else if (actionType === 'safety') {
            result.current.handleAddSafety(ballsRemaining);
          } else {
            result.current.handleAddMiss(ballsRemaining);
          }
        });

        assertSimulationInvariants(result.current);
      }

      expect(
        result.current.state.gameWinner,
        `game ${gameIndex + 1} should complete within the action budget`,
      ).not.toBeNull();
      assertSimulationInvariants(result.current);
    }
  }, 15000);
});
