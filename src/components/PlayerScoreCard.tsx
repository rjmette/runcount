import React, { useMemo, memo } from 'react';

import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { type Player } from '../types/game';

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
  isInitialBreak?: boolean; // True only before any actions in inning 1
  onBreakClick?: () => void; // New prop for handling break indicator clicks
}

const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  player,
  isActive,
  onAddScore: _onAddScore,
  onAddFoul: _onAddFoul,
  onAddSafety: _onAddSafety,
  onAddMiss: _onAddMiss,
  onShowHistory: _onShowHistory,
  targetScore,
  onRegularShot: _onRegularShot,
  needsReBreak,
  isInitialBreak,
  onBreakClick,
}) => {
  // Animate score changes: ramps up on increases, quick-drop on fouls.
  const animatedScore = useAnimatedCounter(player.score);

  // Memoize expensive calculations
  const { bpi, percentage } = useMemo(() => {
    const bpiValue =
      player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00';
    const percentageValue = Math.min(100, Math.floor((player.score / targetScore) * 100));
    return { bpi: bpiValue, percentage: percentageValue };
  }, [player.score, player.innings, targetScore]);

  const hasWon = player.score >= targetScore;
  const scoreStateClass = hasWon ? 'win' : player.score < 0 ? 'negative' : '';

  return (
    <div
      data-testid="player-card"
      aria-current={isActive ? 'true' : undefined}
      className={`rc-card ${isActive ? 'active' : ''}`}
    >
      <div className="rc-card-top">
        <h3 className="rc-name">
          <span className="rc-name-dot" />
          <span className="rc-name-text">{player.name}</span>
        </h3>
        {isActive && <span className="rc-attable">At table</span>}
        {isActive && !needsReBreak && isInitialBreak && (
          <button
            onClick={onBreakClick}
            className="rc-break-btn"
            title="Click to change breaking player"
          >
            Break
          </button>
        )}
        {needsReBreak && <span className="rc-chip rebreak">Re-Break</span>}
        {player.consecutiveFouls >= 2 && <span className="rc-chip fouls">2 Fouls</span>}
      </div>

      <div className="rc-score-block">
        <span
          data-testid={`player-score-${player.id}`}
          className={`rc-score ${scoreStateClass}`}
        >
          {animatedScore < 0 && '-'}
          {Math.abs(animatedScore)}
        </span>
        <span className="rc-of">
          of {targetScore}
          {hasWon && (
            <span className="rc-trophy" aria-hidden="true">
              {' '}
              🏆
            </span>
          )}
        </span>
      </div>

      <div className="rc-progress">
        <div
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Score progress: ${player.score} of ${targetScore} points (${percentage}%)`}
        />
      </div>

      <div className="rc-statstrip">
        <span className="si">
          <i>High</i>
          <b>{player.highRun}</b>
        </span>
        <span className="si">
          <i>BPI</i>
          <b>{bpi}</b>
        </span>
        <span className="si">
          <i>Safe</i>
          <b>{player.safeties}</b>
        </span>
        <span className="si">
          <i>Foul</i>
          <b>{player.fouls}</b>
        </span>
      </div>
    </div>
  );
};

export default memo(PlayerScoreCard);
