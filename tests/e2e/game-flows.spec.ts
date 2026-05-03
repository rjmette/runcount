import { expect, test } from '../setup';

import {
  acknowledgeAlert,
  commitFoul,
  completeRack,
  recordMiss,
  startNewGame,
} from './helpers';

test.describe('Straight pool core flows', () => {
  test('starts a new game and renders the scoring dashboard', async ({ page }) => {
    await startNewGame(page);

    const playerCards = page.getByTestId('player-card');
    await expect(playerCards).toHaveCount(2);
    await expect(playerCards.first()).toContainText('Alice');
    await expect(playerCards.nth(1)).toContainText('Bob');
    // Active player on initial break is the only card showing the Break button
    await expect(
      playerCards.first().getByRole('button', { name: 'Break' }),
    ).toBeVisible();
    await expect(playerCards.nth(1).getByRole('button', { name: 'Break' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Innings' })).toBeVisible();
  });

  test('completes a rack and updates score/high run via Balls On Table modal', async ({
    page,
  }) => {
    await startNewGame(page, { playerOneTarget: 30, playerTwoTarget: 30 });

    await completeRack(page, 1);

    await expect(page.getByTestId('player-score-0')).toHaveText('14');
    await expect(page.getByTestId('player-score-1')).toHaveText('0');
  });

  test('applies break and standard foul penalties with appropriate UI prompts', async ({
    page,
  }) => {
    await startNewGame(page, { playerOneTarget: 30, playerTwoTarget: 30 });

    await commitFoul(page, { breakPenalty: 2, ballsRemaining: 15 });
    await acknowledgeAlert(page, /2-point penalty applied/i);

    await page.getByRole('button', { name: 'Accept the table as-is' }).click();

    await expect(page.getByTestId('player-score-0')).toHaveText('-2');

    await commitFoul(page, { ballsRemaining: 15 });

    await expect(page.getByTestId('player-score-1')).toHaveText('-1');
    await expect(page.getByTestId('alert-modal')).toBeHidden();
  });

  test('enforces the three-foul penalty and re-break reminder', async ({ page }) => {
    await startNewGame(page, { playerOneTarget: 40, playerTwoTarget: 40 });

    await completeRack(page, 1);
    await commitFoul(page, { ballsRemaining: 15 });

    await recordMiss(page, 15);
    await commitFoul(page, { ballsRemaining: 15 });
    await acknowledgeAlert(page, /two consecutive fouls/i);

    await recordMiss(page, 15);
    await commitFoul(page, { ballsRemaining: 15 });
    await page.getByRole('button', { name: /16 Pt\. Foul/ }).click();
    await acknowledgeAlert(page, /three consecutive fouls!.*16-point penalty applied/i);

    await expect(page.getByTestId('player-score-0')).toHaveText('-4');
    await expect(page.getByTestId('player-card').first()).toContainText('Re-Break');
  });

  test('completes a game and returns to setup after viewing statistics', async ({
    page,
  }) => {
    await startNewGame(page, { playerOneTarget: 10, playerTwoTarget: 10 });

    await completeRack(page, 1);
    // The scoring screen utility row has an "End Game" button that opens the
    // confirm modal, which itself has an "End Game" confirm button — `.first()`
    // targets the row button.
    await page
      .getByRole('button', { name: /^End Game$/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: 'End Game?' })).toBeVisible();

    // Now the modal is open, click the modal's confirm button (last match).
    await page
      .getByRole('button', { name: /^End Game$/ })
      .last()
      .click();

    // Stats screen uses a "Game Result" kicker + contextual headline rather
    // than a generic "Game Statistics" heading.
    await expect(page.getByTestId('game-summary-panel')).toBeVisible();
    // The nav bar is hidden for unauthenticated users; the Stats screen has
    // its own "Start New Game" CTA below the summary panel.
    await page.getByRole('button', { name: /Start New Game/i }).click();

    await expect(page.getByRole('heading', { name: 'New Game' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
  });
});
