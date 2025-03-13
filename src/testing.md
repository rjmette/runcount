# Testing in RunCount

This document provides guidelines for writing and running tests for the RunCount application.

## Running Tests

To run all tests:
```bash
npm test
```

To run a specific test file:
```bash
npm test -- src/components/GameSetup.test.tsx
```

To run tests with a specific name pattern:
```bash
npm test -- -t "GameSetup Component"
```

To run tests in watch mode (automatically re-run tests when files change):
```bash
npm test -- --watch
```

## Testing Structure

We use the following testing libraries:
- Jest - as the test runner and assertion library
- React Testing Library - to render and interact with React components
- user-event - to simulate more realistic user interactions

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

1. **Test Component Behavior, Not Implementation**
   - Focus on testing what users would see and do
   - Avoid testing implementation details that could change

2. **Use Data Attributes for Testing**
   - Use `data-testid` attributes to find elements when text content or roles aren't appropriate

3. **Mock External Dependencies**
   - Mock Supabase calls to avoid real API requests
   - Mock complex child components when testing parent components

4. **Test Edge Cases**
   - Test error states and boundary conditions
   - Test with different user states (logged in, logged out)

5. **Keep Tests Independent**
   - Each test should be able to run independently of other tests
   - Use `beforeEach` to reset state between tests

## Mocking Strategy

### Mocking Supabase
For most tests, we mock the Supabase client to avoid real API calls:

```typescript
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      // Add other methods as needed
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      // Add other methods as needed
    }),
  }),
}));
```

### Mocking Authentication Context
When testing components that use authentication:

```typescript
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    signOut: jest.fn(),
  }),
}));
```

## Test Coverage

Run coverage reports to identify areas that need more testing:

```bash
npm test -- --coverage
```

We aim for high coverage in critical areas like:
- Game scoring logic
- Authentication flows
- Form validation

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
  const mockFn = jest.fn();
  render(<ScoreButton label="Test" value={5} onClick={mockFn} />);
  
  await userEvent.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalledWith(5);
});
```

### Testing Form Submission
```typescript
test('submits form with correct data', async () => {
  const mockSubmit = jest.fn();
  render(<GameSetup startGame={mockSubmit} />);
  
  await userEvent.type(screen.getByLabelText(/Player 1/i), 'Player One');
  await userEvent.type(screen.getByLabelText(/Player 2/i), 'Player Two');
  
  await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));
  
  expect(mockSubmit).toHaveBeenCalled();
});
```