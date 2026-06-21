import React from 'react';

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import GameScoring from '..';

import type * as GamePersistContextModule from '../../../context/GamePersistContext';

vi.mock('../../../context/GamePersistContext', async () => {
  const actual = await vi.importActual<typeof GamePersistContextModule>(
    '../../../context/GamePersistContext',
  );
  return {
    ...actual,
    useGamePersist: () => ({
      saveGameState: vi.fn(),
      getGameState: () => null,
      clearGameState: vi.fn(),
      saveGameSettings: vi.fn(),
      getGameSettings: vi.fn(),
      hasActiveGame: false,
    }),
  };
});

const backend = {
  saveGame: vi.fn(async () => undefined),
} as any;

describe('GameScoring integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test('renders two players and allows opening Balls On Table flow', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    // Player cards should render
    await waitFor(() => {
      expect(screen.getAllByTestId('player-card').length).toBe(2);
    });
  });

  test('logs Player 2 as the acting player when Player 2 breaks', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={1}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Miss$/i }));
    await userEvent.click(await screen.findByRole('button', { name: '15' }));
    await userEvent.click(screen.getByRole('button', { name: /Innings/i }));

    const rows = await screen.findAllByRole('row');
    const firstDataRow = rows[1];

    expect(within(firstDataRow).getByText('Bob')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('Miss')).toBeInTheDocument();
  });

  test('shows the break-foul penalty chooser only on the opening break', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Foul$/i }));

    expect(await screen.findByText('Break Foul Penalty')).toBeInTheDocument();
    expect(screen.queryByTestId('balls-on-table-modal')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    await userEvent.click(screen.getByRole('button', { name: /^Miss$/i }));
    await userEvent.click(await screen.findByRole('button', { name: '15' }));

    await userEvent.click(screen.getByRole('button', { name: /^Foul$/i }));

    expect(await screen.findByTestId('balls-on-table-modal')).toBeInTheDocument();
    expect(screen.queryByText('Break Foul Penalty')).not.toBeInTheDocument();
  });

  test('supports the illegal-break flow on the opening shot', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Foul$/i }));
    await userEvent.click(
      await screen.findByRole('button', { name: /Illegal Break \(-2 points\)/i }),
    );
    await userEvent.click(await screen.findByRole('button', { name: '15' }));

    expect(await screen.findByText('Foul on the Break')).toBeInTheDocument();
    expect(
      screen.getByText('Alice has fouled on the opening break.'),
    ).toBeInTheDocument();
  });

  test('opens in-game help with straight pool guidance', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /show help/i }));

    expect(await screen.findByText('14.1 Straight Pool Help')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Balls on Table\. When a turn ends, enter how many object balls remain/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Balls Per Inning/i)).toBeInTheDocument();
  });

  test('does not offer fewer than two balls in the BOT dialog', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Miss$/i }));

    expect(await screen.findByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '0' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
  });

  test('offers zero or one after tapping Rack with two balls on the table', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 100, Bob: 100 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Miss$/i }));
    await userEvent.click(await screen.findByRole('button', { name: '2' }));

    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));

    expect(await screen.findByRole('button', { name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
  });

  test('does not open Rack flow before the two-ball rack point', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 100, Bob: 100 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Miss$/i }));
    await userEvent.click(await screen.findByRole('button', { name: '5' }));

    const rackButton = screen.getByRole('button', { name: /Rack/i });
    expect(rackButton).toBeDisabled();

    await userEvent.click(rackButton);
    expect(screen.queryByTestId('balls-on-table-modal')).not.toBeInTheDocument();
  });

  test('shows BOT in a dedicated status strip above the action buttons', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    expect(screen.getByTestId('bot-indicator')).toHaveAttribute(
      'aria-label',
      'Balls on Table: 15',
    );
    expect(screen.queryByTestId('match-timer-bot')).not.toBeInTheDocument();
  });

  test('shows running turn timer without limit badge when shot clock is off', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={null}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    expect(await screen.findByTestId('turn-timer')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Shot clock set to/i)).not.toBeInTheDocument();
  });

  test('shows the configured shot clock duration when enabled', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={35}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    expect(
      await screen.findByLabelText('Shot clock set to 35 seconds'),
    ).toHaveTextContent('35s');
  });
});
