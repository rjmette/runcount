import React from 'react';
import { Player } from '../types/game';
import ScoreButton from './ScoreButton';

interface PlayerScoreCardProps {
  player: Player;
  isActive: boolean;
  onAddScore: (score: number) => void;
  onAddFoul: (ballsOnTable?: number) => void;
  onAddSafety: (ballsOnTable?: number) => void;
  onAddMiss: (ballsOnTable?: number) => void;
  onShowHistory?: () => void;
  targetScore: number;
  onRegularShot?: (value: number) => void; // New prop for handling regular shots
  needsReBreak?: boolean; // New prop to indicate if this player needs to re-break
}

const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  player,
  isActive,
  onAddScore,
  onAddFoul,
  onAddSafety,
  onAddMiss,
  onShowHistory,
  targetScore,
  onRegularShot,
  needsReBreak
}) => {
  // Calculate average balls per inning
  const bpi = player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00';
  
  // Calculate percentage to target (capped at 100%)
  const percentage = Math.min(100, Math.floor((player.score / targetScore) * 100));
  
  return (
    <div 
      data-testid="player-card"
      className={`rounded-lg shadow-md p-3 mb-2 transition-all ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500' 
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-80'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold dark:text-white">
          {player.name}
          {player.score >= targetScore && <span className="ml-1 text-yellow-500">🏆</span>}
        </h3>
        <div className="flex space-x-2">
          {isActive && <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">Active</span>}
          {needsReBreak && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">Re-Break</span>}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
        <div className="text-center sm:text-left mb-2 sm:mb-0">
          <span className={`block text-3xl font-bold ${player.score >= targetScore ? 'text-green-600 dark:text-green-500' : 'text-blue-700 dark:text-blue-400'}`}>{player.score}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Score</span>
        </div>
        
        <div className="flex space-x-3">
          <div className="text-center">
            <span className="block text-base font-semibold dark:text-white">{player.innings}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Innings</span>
          </div>
          
          <div className="text-center">
            <span className="block text-base font-semibold dark:text-white">{player.highRun}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">High Run</span>
          </div>
          
          <div className="text-center">
            <span className="block text-base font-semibold dark:text-white">{bpi}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">BPI</span>
          </div>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div 
          className={`${player.score >= targetScore ? 'bg-green-600 dark:bg-green-500' : 'bg-blue-600 dark:bg-blue-500'} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isActive && (
        <>
          {/* Current run is still tracked in the DOM but hidden from display */}
          <div className="hidden">
            <span id="current-run">0</span>
          </div>
        
          <div className="grid grid-cols-2 gap-3 mt-4">          
            <ScoreButton
              label="Miss"
              value={0}
              onClick={() => onAddMiss()}
              className="bg-gray-600 hover:bg-gray-700 col-span-2"
            />
            
            <ScoreButton
              label="Foul (-1)"
              value={-1}
              onClick={() => onAddFoul()}
              className="bg-red-600 hover:bg-red-700"
            />
            
            <ScoreButton
              label="Safety"
              value={0}
              onClick={() => onAddSafety()}
              className="bg-yellow-600 hover:bg-yellow-700"
            />
            
            <ScoreButton
              label="New Rack"
              value={1}
              onClick={() => onAddScore(1)}
              className="bg-green-600 hover:bg-green-700"
            />
            
            <ScoreButton
              label="History"
              value={0}
              onClick={() => onShowHistory && onShowHistory()}
              className="bg-blue-600 hover:bg-blue-700"
            />
          </div>
        </>
      )}
      
      <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
        <div>
          <span className="font-medium dark:text-gray-300">{player.fouls}</span> Fouls
        </div>
        <div>
          <span className="font-medium dark:text-gray-300">{player.safeties}</span> Safeties
        </div>
        <div>
          <span className="font-medium dark:text-gray-300">{player.missedShots}</span> Misses
        </div>
      </div>
    </div>
  );
};

export default PlayerScoreCard;