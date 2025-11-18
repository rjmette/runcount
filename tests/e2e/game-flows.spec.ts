import { expect, test } from '../setup';
import { acknowledgeAlert, commitFoul, completeRack, recordMiss, startNewGame } from './helpers';

test.describe('Straight pool core flows', () => {
  test('starts a new game and renders the scoring dashboard', async ({ page }) => {
    await startNewGame(page);

    const playerCards = page.getByTestId('player-card');
    await expect(playerCards).toHaveCount(2);
    await expect(playerCards.first()).toContainText('Active');
    await expect(playerCards.first()).toContainText('Alice');
    await expect(playerCards.nth(1)).toContainText('Bob');
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
    await acknowledgeAlert(page, /three consecutive fouls!.*16-point penalty applied/i);

    await expect(page.getByTestId('player-score-0')).toHaveText('-4');
    await expect(page.getByTestId('player-card').first()).toContainText('Re-Break');
  });

  test('completes a game and returns to setup after viewing statistics', async ({
    page,
  }) => {
    await startNewGame(page, { playerOneTarget: 10, playerTwoTarget: 10 });

    await completeRack(page, 1);
    await page.getByRole('button', { name: /^New Game$/ }).click();
    await expect(page.getByText('End Game?')).toBeVisible();

    await page.getByRole('button', { name: 'End Game' }).click();

    await expect(page.getByRole('heading', { name: 'Game Statistics' })).toBeVisible();
    await page.getByRole('main').getByRole('button', { name: 'New Game' }).click();

    await expect(page.getByRole('heading', { name: 'New Game' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
  });
});
