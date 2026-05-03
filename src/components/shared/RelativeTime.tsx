import React, { useState, useEffect, memo } from 'react';

import { formatTimeAgo } from '../../utils/formatTimeAgo';

interface RelativeTimeProps {
  /** The date to display as relative time */
  date: Date | string;
  /** How often to refresh the label, in milliseconds (default: 60 000 = 1 min) */
  refreshInterval?: number;
}

/**
 * Renders a relative-time label (e.g. "5 min ago") that auto-refreshes on a
 * configurable interval.  The full absolute time is shown in a `title`
 * attribute on hover.
 */
export const RelativeTime: React.FC<RelativeTimeProps> = memo(
  ({ date, refreshInterval = 60_000 }) => {
    const [label, setLabel] = useState(() => formatTimeAgo(date));

    useEffect(() => {
      // Sync immediately when `date` changes
      setLabel(formatTimeAgo(date));

      const id = setInterval(() => {
        setLabel(formatTimeAgo(date));
      }, refreshInterval);

      return () => clearInterval(id);
    }, [date, refreshInterval]);

    const absoluteTime = new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return <span title={absoluteTime}>{label}</span>;
  },
);
