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
  targetScore: number;
}

const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  player,
  isActive,
  onAddScore,
  onAddFoul,
  onAddSafety,
  onAddMiss,
  targetScore
}) => {
  // Calculate average balls per inning
  const bpi = player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00';
  
  // Calculate percentage to target
  const percentage = Math.floor((player.score / targetScore) * 100);
  
  return (
    <div 
      className={`rounded-lg shadow-md p-4 mb-4 transition-all ${
        isActive 
          ? 'bg-blue-50 border-2 border-blue-500' 
          : 'bg-white border border-gray-200 opacity-80'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{player.name}</h3>
        {isActive && <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Active</span>}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <span className="block text-4xl font-bold text-blue-700">{player.score}</span>
          <span className="text-sm text-gray-500">Score</span>
        </div>
        
        <div className="flex space-x-4">
          <div className="text-center">
            <span className="block text-lg font-semibold">{player.innings}</span>
            <span className="text-xs text-gray-500">Innings</span>
          </div>
          
          <div className="text-center">
            <span className="block text-lg font-semibold">{player.highRun}</span>
            <span className="text-xs text-gray-500">High Run</span>
          </div>
          
          <div className="text-center">
            <span className="block text-lg font-semibold">{bpi}</span>
            <span className="text-xs text-gray-500">BPI</span>
          </div>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isActive && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="col-span-2">
            <p className="font-medium mb-2">Add Score:</p>
            <div className="grid grid-cols-5 gap-1">
              {[5, 10, 15, 20, 25].map(value => (
                <ScoreButton
                  key={value}
                  label={`+${value}`}
                  value={value}
                  onClick={onAddScore}
                  className="bg-green-600 hover:bg-green-700"
                />
              ))}
            </div>
          </div>
          
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
            label="Miss"
            value={0}
            onClick={() => onAddMiss()}
            className="bg-gray-600 hover:bg-gray-700 col-span-2"
          />
        </div>
      )}
      
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
        <div>
          <span className="block font-medium">{player.fouls}</span>
          <span>Fouls</span>
        </div>
        <div>
          <span className="block font-medium">{player.safeties}</span>
          <span>Safeties</span>
        </div>
        <div>
          <span className="block font-medium">{player.missedShots}</span>
          <span>Misses</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerScoreCard;