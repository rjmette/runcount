import type { FC } from 'react';

import type { BotAction } from '../hooks/useFoulFlow';

interface GameScoringActionsProps {
  onActionClick: (action: Exclude<BotAction, null>) => void;
}

export const GameScoringActions: FC<GameScoringActionsProps> = ({ onActionClick }) => (
  <div className="rc-actions">
    <button type="button" onClick={() => onActionClick('miss')} className="rc-miss">
      Miss
    </button>

    <div className="rc-actions-row">
      <button type="button" onClick={() => onActionClick('safety')} className="rc-act">
        Safety
      </button>
      <button type="button" onClick={() => onActionClick('foul')} className="rc-act">
        Foul
      </button>
      <button
        type="button"
        onClick={() => onActionClick('newrack')}
        className="rc-act rack"
        title="Start a new rack"
      >
        <span aria-hidden="true">+ </span>Rack
      </button>
    </div>
  </div>
);
