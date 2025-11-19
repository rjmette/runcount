import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import { ConsecutiveFoulPenaltyModal } from '../ConsecutiveFoulPenaltyModal';

describe('ConsecutiveFoulPenaltyModal', () => {
  const defaultProps = {
    isOpen: true,
    playerName: 'Alice',
    onSelectPenalty: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders player name and options', () => {
    render(<ConsecutiveFoulPenaltyModal {...defaultProps} />);

    expect(screen.getByText('Confirm Foul Penalty')).toBeInTheDocument();
    expect(screen.getByText(/Alice was on two fouls/i)).toBeInTheDocument();
    expect(screen.getByText('1 Pt. Foul')).toBeInTheDocument();
    expect(screen.getByText('16 Pt. Foul')).toBeInTheDocument();
  });

  test('invokes callback when penalty option selected', () => {
    const onSelectPenalty = vi.fn();
    render(
      <ConsecutiveFoulPenaltyModal {...defaultProps} onSelectPenalty={onSelectPenalty} />,
    );

    fireEvent.click(screen.getByText('16 Pt. Foul'));
    expect(onSelectPenalty).toHaveBeenCalledWith('threeFoul');
  });

  test('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<ConsecutiveFoulPenaltyModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('does not render when closed', () => {
    const { container } = render(
      <ConsecutiveFoulPenaltyModal {...defaultProps} isOpen={false} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
