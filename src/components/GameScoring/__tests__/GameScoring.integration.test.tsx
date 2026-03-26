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

const supabase = {
  from: () => ({ upsert: async () => ({ data: null, error: null }) }),
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
        supabase={supabase}
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
        supabase={supabase}
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
        supabase={supabase}
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
        supabase={supabase}
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
        supabase={supabase}
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

    await userEvent.click(screen.getByRole('button', { name: /\?\s*Help/i }));

    expect(await screen.findByText('14.1 Straight Pool Help')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Balls on Table\. When a turn ends, enter how many object balls remain/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Balls Per Inning/i)).toBeInTheDocument();
  });

  test('resets live BOT display to 15 after a table-clearing miss', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        supabase={supabase}
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
    await userEvent.click(await screen.findByRole('button', { name: '0' }));

    await waitFor(() => {
      expect(
        within(screen.getByTestId('bot-indicator')).getByText('15'),
      ).toBeInTheDocument();
    });
  });

  test('shows BOT in a dedicated status strip above the action buttons', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        supabase={supabase}
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

  test('shows shot clock disabled state when the clock is turned off', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        supabase={supabase}
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

    expect(await screen.findByTestId('turn-timer-disabled')).toHaveTextContent(
      'Shot Clock Off',
    );
  });

  test('shows the configured shot clock duration when enabled', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        supabase={supabase}
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
