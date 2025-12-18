# Testing in RunCount

This document provides guidelines for writing and running tests for the RunCount application.

## Running Tests

- Run the entire suite: `npm run test`
- Run a specific file: `npm run test -- PlayerCard.test.tsx`
- Filter by test name: `npm run test -- -t "quick-select"`
- Watch mode for TDD loops: `npm run test:watch`
- Open the Vitest UI for debugging: `npm run test:ui`

## Tooling

We rely on:

- **Vitest** as the test runner and assertion library
- **@testing-library/react** for rendering and semantic queries
- **@testing-library/user-event** for realistic input simulation

## Test Types

### Unit Tests

Unit tests focus on testing individual components or functions in isolation. Examples include:

- Testing the ScoreButton component renders correctly and handles clicks
- Testing that the GameSetup component validates form inputs properly
- Testing utility functions

### Integration Tests

Integration tests check that different parts of the application work well together. Examples include:

- Testing that the App component correctly manages game state
- Testing that authentication flows work correctly

## Best Practices

1. **Test behavior over implementation**
   - Assert on roles, labels, and accessible text rather than CSS classes (`aria-pressed`, `aria-label`, etc.)
   - Avoid `container.querySelector` and Tailwind-specific expectations; prefer `screen.getByRole` / `getByLabelText`

2. **Prefer semantic queries**
   - `getByRole` > `getByLabelText` > `getByText`; only drop to `getByTestId` when there is no semantic alternative

3. **Use shared factories/utilities**
   - Import builders from `src/testing/factories.ts` to keep mock data consistent
   - Add new helpers alongside factories when you spot duplication (e.g., render helpers, auth stubs)

4. **Mock external dependencies**
   - Stub Supabase/network calls and heavy child components to focus on the unit under test

5. **Keep tests independent**
   - Reset mocks with `beforeEach`, avoid stateful singletons, and prefer `userEvent` for realistic input

6. **Test edge cases**
   - Cover error states, authentication flows, and scoring edge cases identified in GitHub issues

## Mocking Strategy

### Mocking Supabase

For most tests, mock the Supabase client (or the hooks that depend on it) so no real API calls leave your machine. Vitest's `vi.mock` mirrors Jest's API for these cases.

### Mocking Authentication Context

When a component depends on `useAuth`, create a lightweight mock that returns `{ user, loading, signOut: vi.fn() }` scoped to that test file. Reuse helpers if multiple tests share the same setup.

## Test Coverage

Run coverage reports to identify areas that need more testing:

```bash
npm test -- --coverage
```

We aim for high coverage in critical areas like:

- Game scoring logic
- Authentication flows
- Form validation

## Shared Test Utilities

- `src/testing/factories.ts` – reusable builders such as `createMockPlayer` to keep component tests focused on behavior.
- Add new helpers (e.g., `renderWithProviders`) here so they can be imported consistently across the suite.

## Example Tests

### Basic Component Test

```typescript
test('renders button with correct text', () => {
  render(<ScoreButton label="Test" value={5} onClick={() => {}} />);
  expect(screen.getByRole('button')).toHaveTextContent('Test');
});
```

### Testing User Interactions

```typescript
test('calls function when clicked', async () => {
  const mockFn = vi.fn();
  render(<ScoreButton label="Test" value={5} onClick={mockFn} />);

  await userEvent.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalledWith(5);
});
```

### Testing Form Submission

```typescript
test('submits form with correct data', async () => {
  const mockSubmit = vi.fn();
  render(<GameSetup startGame={mockSubmit} />);

  await userEvent.type(screen.getByLabelText(/Player 1/i), 'Player One');
  await userEvent.type(screen.getByLabelText(/Player 2/i), 'Player Two');

  await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

  expect(mockSubmit).toHaveBeenCalled();
});
```
