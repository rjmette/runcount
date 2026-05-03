import type { CSSProperties, FC } from 'react';

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
        const style: CSSProperties = {
          borderColor: metric.color,
          backgroundColor: isActive ? metric.color : undefined,
        };
        const stateClasses = isActive
          ? 'text-white shadow-sm'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 opacity-60 hover:opacity-100';
        return (
          <button
            key={metric.key}
            type="button"
            onClick={() => onToggle(metric.key)}
            aria-pressed={isActive}
            style={style}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${stateClasses}`}
          >
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
              style={{
                backgroundColor: isActive ? '#ffffff' : metric.color,
              }}
            />
            {metric.label}
          </button>
        );
      })}
    </div>
  );
};
