import type { Page } from '@playwright/test';
import { expect } from '../setup';

type GameSetupOptions = {
  playerOne?: string;
  playerTwo?: string;
  playerOneTarget?: number;
  playerTwoTarget?: number;
  breakingPlayerIndex?: 0 | 1;
};

type FoulOptions = {
  ballsRemaining?: number;
  breakPenalty?: 1 | 2;
};

export const startNewGame = async (page: Page, options: GameSetupOptions = {}) => {
  const {
    playerOne = 'Alice',
    playerTwo = 'Bob',
    playerOneTarget = 50,
    playerTwoTarget = 50,
    breakingPlayerIndex = 0,
  } = options;

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
  await page.getByLabel('Player 1 name').fill(playerOne);
  await page.getByLabel('Player 2 name').fill(playerTwo);
  await page
    .getByLabel('Player 1 target score', { exact: true })
    .fill(playerOneTarget.toString());
  await page
    .getByLabel('Player 2 target score', { exact: true })
    .fill(playerTwoTarget.toString());

  const breakerLabel =
    breakingPlayerIndex === 0
      ? `Select ${playerOne || 'Player 1'} as breaking player`
      : `Select ${playerTwo || 'Player 2'} as breaking player`;
  await page.getByRole('button', { name: breakerLabel }).click();

  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByTestId('player-card')).toHaveCount(2);
};

export const selectBallsOnTableValue = async (page: Page, value: number) => {
  const modal = page.getByTestId('balls-on-table-modal');
  await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: String(value), exact: true }).click();
  await expect(modal).toBeHidden();
};

export const completeRack = async (page: Page, ballsRemaining = 1) => {
  await page.getByRole('button', { name: /rack/i }).click();
  await selectBallsOnTableValue(page, ballsRemaining);
};

export const recordMiss = async (page: Page, ballsRemaining = 15) => {
  await page.getByRole('button', { name: /^Miss$/ }).click();
  await selectBallsOnTableValue(page, ballsRemaining);
};

export const commitFoul = async (page: Page, options: FoulOptions = {}) => {
  const { ballsRemaining = 15, breakPenalty } = options;
  await page.getByRole('button', { name: /^Foul$/ }).click();

  if (breakPenalty) {
    const penaltyLabel =
      breakPenalty === 1
        ? 'Scratch on Legal Break (-1 point)'
        : 'Illegal Break (-2 points)';
    await page.getByRole('button', { name: penaltyLabel }).click();
  }

  await selectBallsOnTableValue(page, ballsRemaining);
};

export const acknowledgeAlert = async (page: Page, message?: string | RegExp) => {
  const modal = page.getByTestId('alert-modal');
  await expect(modal).toBeVisible();
  if (message) {
    await expect(modal).toContainText(message);
  }
  await modal.getByRole('button', { name: 'OK' }).click();
  await expect(modal).toBeHidden();
};
