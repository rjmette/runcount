import React from 'react';
import { ScoreButtonProps } from '../types/game';

const ScoreButton: React.FC<ScoreButtonProps> = ({ label, value, onClick, className = '' }) => {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-md text-white font-medium shadow-md hover:shadow-lg transition-all ${className}`}
    >
      {label}
    </button>
  );
};

export default ScoreButton;