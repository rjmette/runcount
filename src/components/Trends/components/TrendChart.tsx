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

interface TrendChartProps {
  title: string;
  color: string;
  metric: TrendMetric;
  unit?: string;
  data: PlayerTrendPoint[];
  decimals?: number;
}

const formatDateLabel = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const TrendChart: FC<TrendChartProps> = ({
  title,
  color,
  metric,
  unit = '',
  data,
  decimals = 0,
}) => {
  const formatValue = (value: number) => `${value.toFixed(decimals)}${unit}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-12 text-center">
          No completed games yet
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220} minWidth={0}>
          <LineChart data={data} margin={{ top: 5, right: 12, bottom: 5, left: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDateLabel}
              stroke="currentColor"
              tick={{ fontSize: 12 }}
              minTickGap={24}
            />
            <YAxis
              stroke="currentColor"
              tick={{ fontSize: 12 }}
              width={36}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              labelFormatter={(label) =>
                new Date(label as number).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
              formatter={(value) => [formatValue(value as number), title]}
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.92)',
                border: 'none',
                borderRadius: '0.375rem',
                color: '#f9fafb',
              }}
              itemStyle={{ color: '#f9fafb' }}
              labelStyle={{ color: '#d1d5db' }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
