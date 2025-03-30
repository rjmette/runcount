import { Player, GameAction } from '../../../types/game';

interface UseGameActionsProps {
  playerData: Player[];
  activePlayerIndex: number;
  currentRun: number;
  ballsOnTable: number;
  actions: GameAction[];
  gameId: string;
  currentInning: number;
  saveGameToSupabase: (
    gameId: string,
    players: Player[],
    actions: GameAction[],
    completed: boolean,
    winner_id: number | null
  ) => void;
  setPlayerData: (data: Player[]) => void;
  setActions: (actions: GameAction[]) => void;
  setBallsOnTable: (count: number) => void;
  setCurrentRun: (run: number) => void;
  setActivePlayerIndex: (index: number) => void;
  setCurrentInning: (inning: number) => void;
  setGameWinner: (winner: Player | null) => void;
  setShowEndGameModal: (show: boolean) => void;
  setPlayerNeedsReBreak: (playerId: number | null) => void;
  setShowAlertModal: (show: boolean) => void;
  setAlertMessage: (message: string) => void;
  setIsUndoEnabled: (enabled: boolean) => void;
  playerNeedsReBreak: number | null;
}

export const useGameActions = ({
  playerData,
  activePlayerIndex,
  currentRun,
  ballsOnTable,
  actions,
  gameId,
  currentInning,
  saveGameToSupabase,
  setPlayerData,
  setActions,
  setBallsOnTable,
  setCurrentRun,
  setActivePlayerIndex,
  setCurrentInning,
  setGameWinner,
  setShowEndGameModal,
  setPlayerNeedsReBreak,
  setShowAlertModal,
  setAlertMessage,
  setIsUndoEnabled,
  playerNeedsReBreak,
}: UseGameActionsProps) => {
  const handleAddScore = (score: number, botsValue?: number) => {
    if (botsValue === undefined) {
      return { needsBOTInput: true, action: 'newrack' };
    }

    const ballsPocketed = Math.max(0, ballsOnTable - botsValue);
    const pointsScored = ballsPocketed;

    const newAction: GameAction = {
      type: 'score',
      playerId: playerData[activePlayerIndex].id,
      value: pointsScored,
      timestamp: new Date(),
      ballsOnTable: 15,
    };

    if (playerNeedsReBreak === playerData[activePlayerIndex].id) {
      setPlayerNeedsReBreak(null);
    }

    setBallsOnTable(15);
    setActions([...actions, newAction]);
    setIsUndoEnabled(true);

    const updatedPlayerData = [...playerData];
    updatedPlayerData[activePlayerIndex].score += pointsScored;
    updatedPlayerData[activePlayerIndex].consecutiveFouls = 0;

    const newCurrentRun = currentRun + pointsScored;
    setCurrentRun(newCurrentRun);
    if (newCurrentRun > updatedPlayerData[activePlayerIndex].highRun) {
      updatedPlayerData[activePlayerIndex].highRun = newCurrentRun;
    }

    setPlayerData(updatedPlayerData);
    saveGameToSupabase(
      gameId,
      updatedPlayerData,
      [...actions, newAction],
      false,
      null
    );

    return { needsBOTInput: false };
  };

  const handleAddFoul = (botsValue?: number) => {
    if (botsValue === undefined) {
      return { needsBOTInput: true, action: 'foul' };
    }

    const isThirdConsecutiveFoul =
      playerData[activePlayerIndex].consecutiveFouls === 2;

    // Check if this is the first action of the game (i.e., the opening break)
    // or if the player needs to re-break
    const isOpeningBreak =
      (actions.length === 0 && currentInning === 1) ||
      playerNeedsReBreak === playerData[activePlayerIndex].id;

    const newAction: GameAction = {
      type: 'foul',
      playerId: playerData[activePlayerIndex].id,
      value: isOpeningBreak ? -2 : -1, // -2 for foul on break, -1 for regular foul
      timestamp: new Date(),
      ballsOnTable: botsValue,
      reBreak: isThirdConsecutiveFoul,
      isBreakFoul: isOpeningBreak,
    };

    const ballsPocketed = Math.max(0, ballsOnTable - botsValue);
    setBallsOnTable(botsValue);
    setActions([...actions, newAction]);
    setIsUndoEnabled(true);

    const nextPlayerIndex = (activePlayerIndex + 1) % playerData.length;
    const updatedPlayerData = [...playerData];

    const hasScoreActions = actions.some(
      (action) =>
        action.type === 'score' &&
        action.playerId === playerData[activePlayerIndex].id
    );

    const totalToAdd = hasScoreActions
      ? ballsPocketed
      : currentRun + ballsPocketed;
    updatedPlayerData[activePlayerIndex].score += totalToAdd;

    if (totalToAdd > updatedPlayerData[activePlayerIndex].highRun) {
      updatedPlayerData[activePlayerIndex].highRun = totalToAdd;
    }

    updatedPlayerData[activePlayerIndex].consecutiveFouls += 1;
    updatedPlayerData[activePlayerIndex].fouls += 1;

    // Check for three consecutive fouls first (regardless of break or not)
    if (updatedPlayerData[activePlayerIndex].consecutiveFouls === 3) {
      // Apply the foul penalty first (-1 or -2 depending on if it's a break foul)
      updatedPlayerData[activePlayerIndex].score -= isOpeningBreak ? 2 : 1;

      // Then apply the additional 15-point penalty for three consecutive fouls
      updatedPlayerData[activePlayerIndex].score -= 15;
      updatedPlayerData[activePlayerIndex].consecutiveFouls = 0;
      setBallsOnTable(15);
      setPlayerNeedsReBreak(updatedPlayerData[activePlayerIndex].id);

      const playerName = updatedPlayerData[activePlayerIndex].name;
      setAlertMessage(
        `${playerName} has committed three consecutive fouls! ${
          isOpeningBreak ? 17 : 16
        }-point penalty applied (${isOpeningBreak ? 2 : 1} for ${
          isOpeningBreak ? 'break ' : ''
        }foul + 15 for three consecutive fouls). ${playerName} must re-break all 15 balls under opening break requirements.`
      );
      setShowAlertModal(true);
    }
    // Handle break fouls that are not three consecutive fouls
    else if (isOpeningBreak) {
      // Apply a -2 penalty for fouling on the break
      updatedPlayerData[activePlayerIndex].score -= 2;

      const breakerName = updatedPlayerData[activePlayerIndex].name;
      const incomingPlayerName = updatedPlayerData[nextPlayerIndex].name;

      setAlertMessage(
        `${breakerName} fouled on the break! 2-point penalty applied. ${incomingPlayerName} can choose to accept the table as-is or require ${breakerName} to break again (with the same foul penalties if they foul again).`
      );
      setShowAlertModal(true);

      // Display warning if they now have two consecutive fouls
      if (updatedPlayerData[activePlayerIndex].consecutiveFouls === 2) {
        const playerName = updatedPlayerData[activePlayerIndex].name;
        setAlertMessage(
          `Warning: ${playerName} has two consecutive fouls. A third consecutive foul will result in a 15-point penalty plus the regular foul deduction.`
        );
        setShowAlertModal(true);
      }

      // Keep the same player as the active player in case a re-break is chosen
      // The actual player switch will be handled by the UI after the incoming player makes their choice
    }
    // Handle regular fouls (not break fouls and not three consecutive)
    else {
      updatedPlayerData[activePlayerIndex].score -= 1;

      if (updatedPlayerData[activePlayerIndex].consecutiveFouls === 2) {
        const playerName = updatedPlayerData[activePlayerIndex].name;
        setAlertMessage(
          `Warning: ${playerName} has two consecutive fouls. A third consecutive foul will result in a 15-point penalty plus the regular 1-point deduction.`
        );
        setShowAlertModal(true);
      }
    }

    setCurrentRun(0);

    // Only switch players if it's not a break foul or a three-foul situation
    // For break fouls, we'll let the UI handle it after the incoming player makes their choice
    if (!isOpeningBreak && !isThirdConsecutiveFoul) {
      if (nextPlayerIndex === 0) {
        setCurrentInning(currentInning + 1);
      }
      updatedPlayerData[nextPlayerIndex].innings += 1;
      setActivePlayerIndex(nextPlayerIndex);
    }

    setPlayerData(updatedPlayerData);

    const playerTargetScore = updatedPlayerData[activePlayerIndex].targetScore;
    if (updatedPlayerData[activePlayerIndex].score >= playerTargetScore) {
      const winner = { ...updatedPlayerData[activePlayerIndex] };
      setGameWinner(winner);
      setShowEndGameModal(true);
      saveGameToSupabase(
        gameId,
        updatedPlayerData,
        [...actions, newAction],
        true,
        winner.id
      );
    } else {
      saveGameToSupabase(
        gameId,
        updatedPlayerData,
        [...actions, newAction],
        false,
        null
      );
    }

    return { needsBOTInput: false };
  };

  const handleAddSafety = (botsValue?: number) => {
    if (botsValue === undefined) {
      return { needsBOTInput: true, action: 'safety' };
    }

    const newAction: GameAction = {
      type: 'safety',
      playerId: playerData[activePlayerIndex].id,
      value: 0,
      timestamp: new Date(),
      ballsOnTable: botsValue,
    };

    if (playerNeedsReBreak === playerData[activePlayerIndex].id) {
      setPlayerNeedsReBreak(null);
    }

    const ballsPocketed = Math.max(0, ballsOnTable - botsValue);
    setBallsOnTable(botsValue);
    setActions([...actions, newAction]);
    setIsUndoEnabled(true);

    const nextPlayerIndex = (activePlayerIndex + 1) % playerData.length;
    const updatedPlayerData = [...playerData];

    updatedPlayerData[activePlayerIndex].safeties += 1;
    updatedPlayerData[activePlayerIndex].consecutiveFouls = 0;

    const hasScoreActions = actions.some(
      (action) =>
        action.type === 'score' &&
        action.playerId === playerData[activePlayerIndex].id
    );

    const totalToAdd = hasScoreActions
      ? ballsPocketed
      : currentRun + ballsPocketed;
    updatedPlayerData[activePlayerIndex].score += totalToAdd;

    if (totalToAdd > updatedPlayerData[activePlayerIndex].highRun) {
      updatedPlayerData[activePlayerIndex].highRun = totalToAdd;
    }

    setCurrentRun(0);

    if (nextPlayerIndex === 0) {
      setCurrentInning(currentInning + 1);
    }
    updatedPlayerData[nextPlayerIndex].innings += 1;
    setActivePlayerIndex(nextPlayerIndex);

    setPlayerData(updatedPlayerData);

    const playerTargetScore = updatedPlayerData[activePlayerIndex].targetScore;
    if (updatedPlayerData[activePlayerIndex].score >= playerTargetScore) {
      const winner = { ...updatedPlayerData[activePlayerIndex] };
      setGameWinner(winner);
      setShowEndGameModal(true);
      saveGameToSupabase(
        gameId,
        updatedPlayerData,
        [...actions, newAction],
        true,
        winner.id
      );
    } else {
      saveGameToSupabase(
        gameId,
        updatedPlayerData,
        [...actions, newAction],
        false,
        null
      );
    }

    return { needsBOTInput: false };
  };

  const handleAddMiss = (botsValue?: number) => {
    if (botsValue === undefined) {
      return { needsBOTInput: true, action: 'miss' };
    }

    const newAction: GameAction = {
      type: 'miss',
      playerId: playerData[activePlayerIndex].id,
      value: 0,
      timestamp: new Date(),
      ballsOnTable: botsValue,
    };

    if (playerNeedsReBreak === playerData[activePlayerIndex].id) {
      setPlayerNeedsReBreak(null);
    }

    const ballsPocketed = Math.max(0, ballsOnTable - botsValue);
    setBallsOnTable(botsValue);
    setActions([...actions, newAction]);
    setIsUndoEnabled(true);

    const nextPlayerIndex = (activePlayerIndex + 1) % playerData.length;
    const updatedPlayerData = [...playerData];

    updatedPlayerData[activePlayerIndex].missedShots += 1;
    updatedPlayerData[activePlayerIndex].consecutiveFouls = 0;

    const hasScoreActions = actions.some(
      (action) =>
        action.type === 'score' &&
        action.playerId === playerData[activePlayerIndex].id
    );

    const totalToAdd = hasScoreActions
      ? ballsPocketed
      : currentRun + ballsPocketed;
    updatedPlayerData[activePlayerIndex].score += totalToAdd;

    if (totalToAdd > updatedPlayerData[activePlayerIndex].highRun) {
      updatedPlayerData[activePlayerIndex].highRun = totalToAdd;
    }

    setCurrentRun(0);

    if (nextPlayerIndex === 0) {
      setCurrentInning(currentInning + 1);
    }
    updatedPlayerData[nextPlayerIndex].innings += 1;
    setActivePlayerIndex(nextPlayerIndex);

    setPlayerData(updatedPlayerData);

    const playerTargetScore = updatedPlayerData[activePlayerIndex].targetScore;
    if (updatedPlayerData[activePlayerIndex].score >= playerTargetScore) {
      const winner = { ...updatedPlayerData[activePlayerIndex] };
      setGameWinner(winner);
      setShowEndGameModal(true);
      saveGameToSupabase(
        gameId,
        updatedPlayerData,
        [...actions, newAction],
        true,
        winner.id
      );
    } else {
      saveGameToSupabase(
        gameId,
        updatedPlayerData,
        [...actions, newAction],
        false,
        null
      );
    }

    return { needsBOTInput: false };
  };

  return {
    handleAddScore,
    handleAddFoul,
    handleAddSafety,
    handleAddMiss,
  };
};
