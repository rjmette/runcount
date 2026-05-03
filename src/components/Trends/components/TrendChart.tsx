import type { FC } from 'react';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { PlayerTrendPoint, TrendMetric } from '../utils/trendsData';

export interface TrendSeries {
  key: TrendMetric;
  label: string;
  color: string;
  unit?: string;
  decimals?: number;
}

interface TrendChartProps {
  data: PlayerTrendPoint[];
  series: TrendSeries[];
}

const formatDateLabel = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatSeriesValue = (value: number, entry: TrendSeries) =>
  `${value.toFixed(entry.decimals ?? 0)}${entry.unit ?? ''}`;

export const TrendChart: FC<TrendChartProps> = ({ data, series }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
        Performance over time
      </h3>
      {series.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-16 text-center">
          Select a metric above to see its trend.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
          <LineChart data={data} margin={{ top: 5, right: 12, bottom: 5, left: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDateLabel}
              stroke="currentColor"
              tick={{ fontSize: 12 }}
              minTickGap={24}
            />
            {series.map((entry) => (
              <YAxis key={entry.key} yAxisId={entry.key} hide domain={['auto', 'auto']} />
            ))}
            <Tooltip
              labelFormatter={(label) =>
                new Date(label as number).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
              formatter={(value, _name, item) => {
                const dataKey = (item as { dataKey?: string }).dataKey as
                  | TrendMetric
                  | undefined;
                const matched = series.find((entry) => entry.key === dataKey);
                if (!matched) return [String(value), String(_name)];
                const numeric = typeof value === 'number' ? value : Number(value);
                return [formatSeriesValue(numeric, matched), matched.label];
              }}
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.92)',
                border: 'none',
                borderRadius: '0.375rem',
                color: '#f9fafb',
              }}
              itemStyle={{ color: '#f9fafb' }}
              labelStyle={{ color: '#d1d5db' }}
            />
            {series.map((entry) => (
              <Line
                key={entry.key}
                type="monotone"
                yAxisId={entry.key}
                dataKey={entry.key}
                name={entry.label}
                stroke={entry.color}
                strokeWidth={2}
                dot={{ r: 3, fill: entry.color }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
