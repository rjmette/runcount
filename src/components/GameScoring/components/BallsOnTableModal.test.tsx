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

  it('shows zero and one options for non-rack actions when few balls remain', () => {
    render(<BallsOnTableModal {...baseProps} currentBallsOnTable={1} action="safety" />);

    expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });

  it('limits rack flow to 0 or 1 only', () => {
    render(<BallsOnTableModal {...baseProps} action="newrack" />);

    expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
  });

  it('calls onSubmit with the selected value', () => {
    const onSubmit = vi.fn();
    render(<BallsOnTableModal {...baseProps} onSubmit={onSubmit} action="miss" />);

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onSubmit).toHaveBeenCalledWith(3);
  });
});
