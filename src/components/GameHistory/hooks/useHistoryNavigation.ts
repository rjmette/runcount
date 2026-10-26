import { useState } from 'react';

import { type GameData } from '../../../types/game';

import { useGameSelection } from './useGameSelection';

interface UseHistoryNavigationArgs {
  games: GameData[];
  filteredGames: GameData[];
  deleteGame: (gameId: string) => Promise<boolean>;
}

export const useHistoryNavigation = ({
  games,
  filteredGames,
  deleteGame,
}: UseHistoryNavigationArgs) => {
  const [view, setView] = useState<'list' | 'details'>('list');

  const {
    selectedGameId,
    selectedGame,
    showDeleteConfirmation,
    gameToDelete,
    handleGameSelect,
    confirmDelete,
    cancelDelete,
    handleDeleteSuccess,
  } = useGameSelection({ games });

  const handleDeleteGame = async (gameId: string) => {
    const success = await deleteGame(gameId);
    if (success) {
      handleDeleteSuccess();
      // If we're in details view and deleted the current game, go back to list
      if (view === 'details' && gameId === selectedGameId) {
        setView('list');
      }
    }
  };

  const handleSelectGame = (gameId: string) => {
    handleGameSelect(gameId);
    setView('details');
  };

  const handleBackToList = () => {
    setView('list');
  };

  const selectedIndex = filteredGames.findIndex((game) => game.id === selectedGameId);

  const handlePreviousGame = () => {
    if (selectedIndex > 0) {
      handleGameSelect(filteredGames[selectedIndex - 1].id);
    }
  };

  const handleNextGame = () => {
    if (selectedIndex < filteredGames.length - 1) {
      handleGameSelect(filteredGames[selectedIndex + 1].id);
    }
  };

  return {
    view,
    selectedGameId,
    selectedGame,
    selectedIndex,
    showDeleteConfirmation,
    gameToDelete,
    confirmDelete,
    cancelDelete,
    handleDeleteGame,
    handleSelectGame,
    handleBackToList,
    handlePreviousGame,
    handleNextGame,
  };
};
