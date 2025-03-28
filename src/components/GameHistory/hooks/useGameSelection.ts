import { useState } from 'react';
import { GameData } from '../../../types/game';

interface UseGameSelectionProps {
  games: GameData[];
}

export const useGameSelection = ({ games }: UseGameSelectionProps) => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);

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
    // If the deleted game was selected, deselect it
    if (gameToDelete === selectedGameId) {
      setSelectedGameId(null);
      setSelectedGame(null);
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
