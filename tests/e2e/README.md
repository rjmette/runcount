# End-to-End Tests

This directory contains Playwright-based end-to-end tests for the straight pool scoring app.

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test game-flows.spec.ts
```

## Test Structure

- **`game-flows.spec.ts`** - Core game flow scenarios
- **`helpers.ts`** - Reusable test helper functions
- **`../setup.ts`** - Global test configuration with console error detection

## Helper Functions

### `startNewGame(page, options?)`

Starts a new game with optional configuration.

**Options:**

- `playerOne` (string, default: 'Alice') - Player 1 name
- `playerTwo` (string, default: 'Bob') - Player 2 name
- `playerOneTarget` (number, default: 50) - Player 1 target score
- `playerTwoTarget` (number, default: 50) - Player 2 target score
- `breakingPlayerIndex` (0 | 1, default: 0) - Which player breaks

**Example:**

```typescript
await startNewGame(page, {
  playerOne: 'Alice',
  playerTwo: 'Bob',
  playerOneTarget: 30,
  playerTwoTarget: 30,
  breakingPlayerIndex: 0,
});
```

### `selectBallsOnTableValue(page, value)`

Selects a value from the "Balls on Table" modal.

**Parameters:**

- `value` (number) - Number of balls remaining (0-15)

**Example:**

```typescript
await selectBallsOnTableValue(page, 1);
```

### `completeRack(page, ballsRemaining?)`

Completes a rack by clicking the Rack button and selecting balls remaining.

**Parameters:**

- `ballsRemaining` (number, default: 1) - Balls left on table

**Example:**

```typescript
await completeRack(page, 1); // Complete rack with 1 ball left
```

### `recordMiss(page, ballsRemaining?)`

Records a miss shot and selects balls remaining.

**Parameters:**

- `ballsRemaining` (number, default: 15) - Balls left on table

**Example:**

```typescript
await recordMiss(page, 15);
```

### `commitFoul(page, options?)`

Commits a foul with optional break penalty specification.

**Options:**

- `ballsRemaining` (number, default: 15) - Balls left on table
- `breakPenalty` (1 | 2) - Break foul penalty (1 = scratch, 2 = illegal break)

**Examples:**

```typescript
// Standard foul
await commitFoul(page, { ballsRemaining: 15 });

// Break foul with 2-point penalty
await commitFoul(page, { breakPenalty: 2, ballsRemaining: 15 });
```

### `acknowledgeAlert(page, message?)`

Dismisses an alert modal, optionally verifying its message.

**Parameters:**

- `message` (string | RegExp, optional) - Expected message text or pattern

**Examples:**

```typescript
// Just dismiss
await acknowledgeAlert(page);

// Verify message first
await acknowledgeAlert(page, /2-point penalty applied/i);
```

## Console Error Detection

All tests automatically fail if any `console.error` or `console.warning` is emitted during test execution. This is configured in `../setup.ts` using a custom Playwright test extension.

## Best Practices

1. **Use semantic queries** - Prefer `getByRole`, `getByLabel` over `getByTestId`
2. **Wait for visibility** - Always verify modals/elements are visible before interaction
3. **Clean assertions** - Use `toHaveText`, `toContainText` over string matching
4. **Descriptive test names** - Clearly state what the test validates
5. **Reuse helpers** - Add new helpers to `helpers.ts` for repeated patterns

## Adding New Tests

1. Create test in `game-flows.spec.ts` or new `.spec.ts` file
2. Use existing helpers or create new ones in `helpers.ts`
3. Follow the pattern: setup → action → assertion
4. Run tests locally before pushing: `npm run test:e2e`

## CI/CD

Tests run automatically in CI with:

- Chromium browser only (configurable in `playwright.config.ts`)
- 2 retries on failure
- Video recording on failure
- Screenshots on failure
- Trace on first retry
