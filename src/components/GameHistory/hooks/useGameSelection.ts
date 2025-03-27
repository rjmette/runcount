import { useState, useEffect } from 'react';
import { GameData } from '../../../types/game';

interface UseGameSelectionProps {
  games: GameData[];
}

export const useGameSelection = ({ games }: UseGameSelectionProps) => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);

  // Auto-select the first game when games are loaded
  useEffect(() => {
    if (games.length > 0 && !selectedGameId) {
      const firstGame = games[0];
      setSelectedGameId(firstGame.id);
      setSelectedGame(firstGame);
    }
  }, [games, selectedGameId]);

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
    const game = games.find((g) => g.id === gameId) || null;
    setSelectedGame(game);
  };

  const confirmDelete = (gameId: string) => {
    setGameToDelete(gameId);
    setShowDeleteConfirmation(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setGameToDelete(null);
  };

  const handleDeleteSuccess = () => {
    // If the deleted game was selected, select the first game in the list
    if (gameToDelete === selectedGameId) {
      const remainingGames = games.filter((g) => g.id !== gameToDelete);
      if (remainingGames.length > 0) {
        const firstGame = remainingGames[0];
        setSelectedGameId(firstGame.id);
        setSelectedGame(firstGame);
      } else {
        setSelectedGameId(null);
        setSelectedGame(null);
      }
    }
    setShowDeleteConfirmation(false);
    setGameToDelete(null);
  };

  return {
    selectedGameId,
    selectedGame,
    showDeleteConfirmation,
    gameToDelete,
    handleGameSelect,
    confirmDelete,
    cancelDelete,
    handleDeleteSuccess,
  };
};
