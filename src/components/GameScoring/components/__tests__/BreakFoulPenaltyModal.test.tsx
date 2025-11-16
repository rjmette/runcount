import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BreakFoulPenaltyModal } from '../BreakFoulPenaltyModal';

describe('BreakFoulPenaltyModal', () => {
  const defaultProps = {
    show: true,
    onClose: vi.fn(),
    onSelectPenalty: vi.fn(),
    playerName: 'Alice',
  };

  it('renders when show is true', () => {
    render(<BreakFoulPenaltyModal {...defaultProps} />);

    expect(screen.getByText('Break Foul Penalty')).toBeInTheDocument();
    expect(screen.getByText('Alice fouled on the break.')).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    render(<BreakFoulPenaltyModal {...defaultProps} show={false} />);

    expect(screen.queryByText('Break Foul Penalty')).not.toBeInTheDocument();
  });

  it('displays correct penalty options with QA-specified text', () => {
    render(<BreakFoulPenaltyModal {...defaultProps} />);

    expect(screen.getByText('Scratch on Legal Break (-1 point)')).toBeInTheDocument();
    expect(screen.getByText('Illegal Break (-2 points)')).toBeInTheDocument();
  });

  it('displays penalty option descriptions', () => {
    render(<BreakFoulPenaltyModal {...defaultProps} />);

    expect(screen.getByText('Break requirement met, but scratched')).toBeInTheDocument();
    expect(screen.getByText('Break requirement NOT met')).toBeInTheDocument();
  });

  it('displays break requirement reminder', () => {
    render(<BreakFoulPenaltyModal {...defaultProps} />);

    expect(screen.getByText('Break requirement:')).toBeInTheDocument();
    expect(screen.getByText('Pocket a ball, OR')).toBeInTheDocument();
    expect(screen.getByText('Cue ball + 2 object balls hit a rail')).toBeInTheDocument();
  });

  it('calls onSelectPenalty with 1 when 1-point button is clicked', () => {
    const onSelectPenalty = vi.fn();
    render(<BreakFoulPenaltyModal {...defaultProps} onSelectPenalty={onSelectPenalty} />);

    const onePointButton = screen.getByText('Scratch on Legal Break (-1 point)').closest('button');
    fireEvent.click(onePointButton!);

    expect(onSelectPenalty).toHaveBeenCalledWith(1);
    expect(onSelectPenalty).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectPenalty with 2 when 2-point button is clicked', () => {
    const onSelectPenalty = vi.fn();
    render(<BreakFoulPenaltyModal {...defaultProps} onSelectPenalty={onSelectPenalty} />);

    const twoPointButton = screen.getByText('Illegal Break (-2 points)').closest('button');
    fireEvent.click(twoPointButton!);

    expect(onSelectPenalty).toHaveBeenCalledWith(2);
    expect(onSelectPenalty).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel X button is clicked', () => {
    const onClose = vi.fn();
    render(<BreakFoulPenaltyModal {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByLabelText('Cancel');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays correct player name in message', () => {
    render(<BreakFoulPenaltyModal {...defaultProps} playerName="Bob" />);

    expect(screen.getByText('Bob fouled on the break.')).toBeInTheDocument();
  });

  it('has proper accessibility attributes on cancel button', () => {
    render(<BreakFoulPenaltyModal {...defaultProps} />);

    const cancelButton = screen.getByLabelText('Cancel');
    expect(cancelButton).toHaveAttribute('aria-label', 'Cancel');
  });

  it('calls onClose when ESC key is pressed', () => {
    const onClose = vi.fn();
    render(<BreakFoulPenaltyModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when other keys are pressed', () => {
    const onClose = vi.fn();
    render(<BreakFoulPenaltyModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'a' });

    expect(onClose).not.toHaveBeenCalled();
  });
});
