import type { FC } from 'react';

import BreakDialog from '../../BreakDialog';
import { InningsModal } from '../../GameStatistics/components/InningsModal';

import { AlertModal } from './AlertModal';
import { BallsOnTableModal } from './BallsOnTableModal';
import { BreakFoulModal } from './BreakFoulModal';
import { BreakFoulPenaltyModal } from './BreakFoulPenaltyModal';
import { ConsecutiveFoulPenaltyModal } from './ConsecutiveFoulPenaltyModal';
import { EndGameModal } from './EndGameModal';
import { GameHelpModal } from './GameHelpModal';

import type { GameAction, Player } from '../../../types/game';
import type { BotAction } from '../hooks/useFoulFlow';

interface GameScoringModalsProps {
  playerData: Player[];
  activePlayerIndex: number;
  actions: GameAction[];
  currentInning: number;
  gameWinner: Player | null;
  ballsOnTable: number;
  players: string[];
  currentBreakingPlayerId: number;
  alertMessage: string;
  foulFlowState: {
    botAction: BotAction;
    showBreakPenaltyModal: boolean;
    showConsecutivePenaltyModal: boolean;
    pendingConsecutiveFoulPlayerId: number | null;
  };
  showBreakFoulModal: boolean;
  showEndGameModal: boolean;
  showBOTModal: boolean;
  showAlertModal: boolean;
  showHelpModal: boolean;
  showBreakDialog: boolean;
  showInningsModal: boolean;
  onCloseBreakFoulModal: () => void;
  onAcceptTable: () => void;
  onRequireReBreak: () => void;
  onCancelBreakFoulPenalty: () => void;
  onSelectBreakFoulPenalty: (penalty: 1 | 2) => void;
  onSelectConsecutivePenalty: (penalty: 'regular' | 'threeFoul') => void;
  onCancelConsecutivePenalty: () => void;
  onCloseEndGameModal: () => void;
  onEndGame: () => void;
  onCloseBOTModal: () => void;
  onBOTSubmit: (botsValue: number) => void;
  onCloseAlertModal: () => void;
  onCloseHelpModal: () => void;
  onCloseBreakDialog: () => void;
  onChangeBreaker: (playerId: number) => void;
  onCloseInningsModal: () => void;
}

export const GameScoringModals: FC<GameScoringModalsProps> = ({
  playerData,
  activePlayerIndex,
  actions,
  currentInning,
  gameWinner,
  ballsOnTable,
  players,
  currentBreakingPlayerId,
  alertMessage,
  foulFlowState,
  showBreakFoulModal,
  showEndGameModal,
  showBOTModal,
  showAlertModal,
  showHelpModal,
  showBreakDialog,
  showInningsModal,
  onCloseBreakFoulModal,
  onAcceptTable,
  onRequireReBreak,
  onCancelBreakFoulPenalty,
  onSelectBreakFoulPenalty,
  onSelectConsecutivePenalty,
  onCancelConsecutivePenalty,
  onCloseEndGameModal,
  onEndGame,
  onCloseBOTModal,
  onBOTSubmit,
  onCloseAlertModal,
  onCloseHelpModal,
  onCloseBreakDialog,
  onChangeBreaker,
  onCloseInningsModal,
}) => (
  <>
    {playerData.length > 0 && (
      <>
        <BreakFoulModal
          show={showBreakFoulModal}
          onClose={onCloseBreakFoulModal}
          onAcceptTable={onAcceptTable}
          onRequireReBreak={onRequireReBreak}
          breaker={playerData[activePlayerIndex]}
          incomingPlayer={playerData[(activePlayerIndex + 1) % playerData.length]}
        />
        <BreakFoulPenaltyModal
          show={foulFlowState.showBreakPenaltyModal}
          onClose={onCancelBreakFoulPenalty}
          onSelectPenalty={onSelectBreakFoulPenalty}
          playerName={playerData[activePlayerIndex]?.name || ''}
        />
        <ConsecutiveFoulPenaltyModal
          isOpen={foulFlowState.showConsecutivePenaltyModal}
          playerName={
            playerData.find(
              (player) => player.id === foulFlowState.pendingConsecutiveFoulPlayerId,
            )?.name || ''
          }
          onSelectPenalty={onSelectConsecutivePenalty}
          onCancel={onCancelConsecutivePenalty}
        />
      </>
    )}

    <EndGameModal
      isOpen={showEndGameModal}
      gameWinner={gameWinner}
      playerData={playerData}
      currentInning={currentInning}
      actions={actions}
      onClose={onCloseEndGameModal}
      onEndGame={onEndGame}
    />

    <BallsOnTableModal
      isOpen={showBOTModal}
      onClose={onCloseBOTModal}
      onSubmit={onBOTSubmit}
      currentBallsOnTable={ballsOnTable}
      action={foulFlowState.botAction}
    />

    <AlertModal
      isOpen={showAlertModal}
      onClose={onCloseAlertModal}
      message={alertMessage}
    />

    <GameHelpModal isOpen={showHelpModal} onClose={onCloseHelpModal} />

    <BreakDialog
      isOpen={showBreakDialog}
      onClose={onCloseBreakDialog}
      onChangeBreaker={onChangeBreaker}
      players={players}
      currentBreakingPlayerId={currentBreakingPlayerId}
    />

    <InningsModal
      isOpen={showInningsModal}
      onClose={onCloseInningsModal}
      actions={actions}
      players={playerData}
    />
  </>
);
