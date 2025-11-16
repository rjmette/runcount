import React, { memo } from 'react';
import { ScoreButtonProps } from '../types/game';

const ScoreButton: React.FC<ScoreButtonProps> = ({
  label,
  value,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-5 py-3 rounded-md text-white font-medium text-lg shadow-md hover:shadow-lg transition-all ${className}`}
    >
      {label}
    </button>
  );
};

export default memo(ScoreButton);
