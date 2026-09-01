import { useEffect } from 'react';

interface UseParentStateSyncArgs {
  matchStartTime: Date | null;
  matchEndTime: Date | null;
  turnStartTime: Date | null;
  ballsOnTable: number;
  parentMatchStartTime: Date | null | undefined;
  parentMatchEndTime: Date | null | undefined;
  parentTurnStartTime: Date | null | undefined;
  parentBallsOnTable: number | undefined;
  parentSetMatchStartTime: (time: Date | null) => void;
  parentSetMatchEndTime: (time: Date | null) => void;
  parentSetTurnStartTime?: (time: Date | null) => void;
  parentSetBallsOnTable: (balls: number) => void;
}

export const useParentStateSync = ({
  matchStartTime,
  matchEndTime,
  turnStartTime,
  ballsOnTable,
  parentMatchStartTime,
  parentMatchEndTime,
  parentTurnStartTime,
  parentBallsOnTable,
  parentSetMatchStartTime,
  parentSetMatchEndTime,
  parentSetTurnStartTime,
  parentSetBallsOnTable,
}: UseParentStateSyncArgs) => {
  useEffect(() => {
    if (matchStartTime !== parentMatchStartTime) {
      parentSetMatchStartTime(matchStartTime);
    }
  }, [matchStartTime, parentMatchStartTime, parentSetMatchStartTime]);

  useEffect(() => {
    if (matchEndTime !== parentMatchEndTime) {
      parentSetMatchEndTime(matchEndTime);
    }
  }, [matchEndTime, parentMatchEndTime, parentSetMatchEndTime]);

  useEffect(() => {
    if (turnStartTime !== parentTurnStartTime && parentSetTurnStartTime) {
      parentSetTurnStartTime(turnStartTime);
    }
  }, [turnStartTime, parentTurnStartTime, parentSetTurnStartTime]);

  useEffect(() => {
    if (ballsOnTable !== parentBallsOnTable) {
      parentSetBallsOnTable(ballsOnTable);
    }
  }, [ballsOnTable, parentBallsOnTable, parentSetBallsOnTable]);
};
