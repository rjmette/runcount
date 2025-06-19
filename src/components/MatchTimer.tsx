import React, { useState, useEffect } from 'react';

interface MatchTimerProps {
  startTime: Date | string | null;
  endTime?: Date | string | null;
  isRunning?: boolean;
}

export const MatchTimer: React.FC<MatchTimerProps> = ({ 
  startTime, 
  endTime, 
  isRunning = true 
}) => {
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');

  useEffect(() => {
    if (!startTime) {
      setElapsedTime('00:00:00');
      return;
    }

    const updateTimer = () => {
      const start = new Date(startTime);
      const end = endTime ? new Date(endTime) : new Date();
      const diff = end.getTime() - start.getTime();
      
      if (diff < 0) {
        setElapsedTime('00:00:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formattedTime = 
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`;
      
      setElapsedTime(formattedTime);
    };

    // Update immediately
    updateTimer();

    // Set up interval only if timer is running and no end time
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !endTime) {
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, endTime, isRunning]);

  return (
    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${
          isRunning && !endTime ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <span className="text-sm font-medium text-gray-600">Match Time:</span>
      </div>
      <span className="text-lg font-mono font-bold text-gray-800">
        {elapsedTime}
      </span>
    </div>
  );
};

export const formatElapsedTime = (startTime: Date | string, endTime?: Date | string): string => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diff = end.getTime() - start.getTime();
  
  if (diff < 0) return '00:00:00';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:` +
         `${minutes.toString().padStart(2, '0')}:` +
         `${seconds.toString().padStart(2, '0')}`;
};

export const getRelativeTimestamp = (actionTime: Date | string, matchStartTime: Date | string): string => {
  const action = new Date(actionTime);
  const start = new Date(matchStartTime);
  const diff = action.getTime() - start.getTime();
  
  if (diff < 0) return '00:00:00';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:` +
         `${minutes.toString().padStart(2, '0')}:` +
         `${seconds.toString().padStart(2, '0')}`;
};