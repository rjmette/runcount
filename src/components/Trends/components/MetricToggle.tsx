import type { FC } from 'react';

import type { TrendMetric } from '../utils/trendsData';

export interface MetricDefinition {
  key: TrendMetric;
  label: string;
  color: string;
}

interface MetricToggleProps {
  metrics: MetricDefinition[];
  visibleMetrics: TrendMetric[];
  onToggle: (metric: TrendMetric) => void;
}

export const MetricToggle: FC<MetricToggleProps> = ({
  metrics,
  visibleMetrics,
  onToggle,
}) => {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Toggle visible metrics"
    >
      {metrics.map((metric) => {
        const isActive = visibleMetrics.includes(metric.key);
        return (
          <button
            key={metric.key}
            type="button"
            onClick={() => onToggle(metric.key)}
            aria-pressed={isActive}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
              style={{ backgroundColor: metric.color }}
            />
            {metric.label}
          </button>
        );
      })}
    </div>
  );
};
