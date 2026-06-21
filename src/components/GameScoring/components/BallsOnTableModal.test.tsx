import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { BallsOnTableModal } from './BallsOnTableModal';

describe('BallsOnTableModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    currentBallsOnTable: 5,
    action: 'miss' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(<BallsOnTableModal {...baseProps} isOpen={false} />);
    expect(screen.queryByTestId('balls-on-table-modal')).not.toBeInTheDocument();
  });

  it('does not render when action is null', () => {
    render(<BallsOnTableModal {...baseProps} action={null} />);
    expect(screen.queryByTestId('balls-on-table-modal')).not.toBeInTheDocument();
  });

  it('does not show values below two for non-rack actions', () => {
    render(<BallsOnTableModal {...baseProps} currentBallsOnTable={1} action="safety" />);

    expect(screen.queryByRole('button', { name: '0' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });

  it('offers only zero and one for a rack action (cleared all, or all but the break ball)', () => {
    render(<BallsOnTableModal {...baseProps} action="newrack" currentBallsOnTable={2} />);

    expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
  });

  it('offers zero and one for a rack action regardless of balls on table', () => {
    render(
      <BallsOnTableModal {...baseProps} action="newrack" currentBallsOnTable={12} />,
    );

    expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '12' })).not.toBeInTheDocument();
  });

  it('calls onClose when cancel is pressed', () => {
    const onClose = vi.fn();
    render(<BallsOnTableModal {...baseProps} onClose={onClose} action="miss" />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit with the selected value', () => {
    const onSubmit = vi.fn();
    render(<BallsOnTableModal {...baseProps} onSubmit={onSubmit} action="miss" />);

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onSubmit).toHaveBeenCalledWith(3);
  });

  it('always uses 4-column grid layout', () => {
    const { rerender } = render(
      <BallsOnTableModal {...baseProps} currentBallsOnTable={2} action="miss" />,
    );

    expect(screen.getByTestId('bot-grid')).toHaveClass('grid-cols-4');

    rerender(<BallsOnTableModal {...baseProps} currentBallsOnTable={10} action="miss" />);
    expect(screen.getByTestId('bot-grid')).toHaveClass('grid-cols-4');
  });

  it('has dialog accessibility attributes', () => {
    render(<BallsOnTableModal {...baseProps} action="miss" />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'balls-on-table-title');
  });

  it('explains how BOT scoring works', () => {
    render(<BallsOnTableModal {...baseProps} action="miss" />);

    expect(screen.getByText(/Tap the count remaining on the table/i)).toBeInTheDocument();
  });
});
