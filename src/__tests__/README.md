# Testing Best Practices for RunCount

This document outlines the testing best practices used in the RunCount project to ensure maintainable, reliable tests.

## General Testing Principles

### 1. Test User Behavior, Not Implementation Details

❌ **Avoid**: Testing CSS classes, internal state, or implementation details
```typescript
// Bad - Brittle and tied to implementation
expect(button).toHaveClass('bg-blue-600');
expect(component.state.isActive).toBe(true);
```

✅ **Prefer**: Testing user-visible behavior and accessibility
```typescript
// Good - Tests what users actually experience
expect(button).toHaveAttribute('aria-pressed', 'true');
expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
```

### 2. Use Semantic Queries

Always prefer queries that match how users and assistive technologies interact with your app:

1. `getByRole()` - Most accessible and user-focused
2. `getByLabelText()` - For form controls
3. `getByText()` - For content users read
4. `getByTestId()` - Last resort when semantic queries don't work

❌ **Avoid**: CSS selectors and implementation-specific queries
```typescript
// Bad
container.querySelector('.player-card')
getByClassName(container, 'bg-blue-600')
```

✅ **Prefer**: Semantic queries
```typescript
// Good
screen.getByRole('button', { name: /Start Game/i })
screen.getByLabelText('Player 1 Name')
screen.getByRole('progressbar')
```

### 3. Add Accessibility Attributes for Better Testing

Enhance components with proper ARIA attributes that benefit both users and tests:

```typescript
// Component
<div
  role="progressbar"
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`Score progress: ${score} of ${target} points`}
/>

// Test
const progressBar = screen.getByRole('progressbar');
expect(progressBar).toHaveAttribute('aria-valuenow', '50');
```

## Test Types and Organization

### Unit Tests
- Test individual components in isolation
- Mock dependencies and external services
- Focus on component API and user interactions
- File pattern: `ComponentName.test.tsx`

### Integration Tests
- Test complete user workflows
- Test component interactions
- Test error scenarios and recovery
- File pattern: `feature-name.integration.test.tsx`

### Examples of Good Test Organization

```
src/
├── components/
│   ├── PlayerScoreCard.tsx
│   ├── PlayerScoreCard.test.tsx      # Unit tests
│   └── GameSetup.test.tsx
├── __tests__/
│   ├── game-workflow.integration.test.tsx      # Complete game flows
│   ├── auth-workflow.integration.test.tsx      # Authentication flows
│   ├── error-recovery.integration.test.tsx     # Error scenarios
│   └── README.md                               # This file
```

## Mock Strategies

### 1. Mock External Dependencies

Always mock external services and heavy dependencies:

```typescript
// Mock Supabase
const mockSupabase = {
  from: () => ({
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    // ...
  }),
};

// Mock authentication
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
```

### 2. Keep Mocks Simple and Focused

Don't over-mock. Only mock what's necessary for the test:

```typescript
// Good - Simple, focused mock
vi.mock('./ScoreButton', () => ({
  default: ({ label, onClick, value }: any) => (
    <button onClick={() => onClick(value)}>
      {label}
    </button>
  ),
}));
```

### 3. Use Test Data Builders

Create reusable test data factories:

```typescript
const createMockPlayer = (overrides = {}) => ({
  id: 1,
  name: 'Test Player',
  score: 0,
  innings: 0,
  // ... other defaults
  ...overrides,
});

const createMockAuth = (user = null, loading = false) => ({
  user,
  loading,
  signOut: vi.fn(),
  // ...
});
```

## Testing Async Behavior

### Use waitFor for Async Updates

```typescript
// Wait for async updates
await waitFor(() => {
  expect(screen.getByText('Game Started')).toBeInTheDocument();
});

// Wait for elements to appear
await waitFor(() => {
  expect(screen.getByRole('button', { name: /Rack/i })).toBeInTheDocument();
});
```

### Use userEvent for Realistic Interactions

```typescript
// Good - Realistic user interactions
const user = userEvent.setup();
await user.type(screen.getByLabelText('Player Name'), 'Alice');
await user.click(screen.getByRole('button', { name: /Start/i }));

// Avoid - Synthetic events
fireEvent.change(input, { target: { value: 'Alice' } });
```

## Error Testing Patterns

### Test Error Boundaries and Recovery

```typescript
test('should handle errors gracefully', async () => {
  // Mock error condition
  mockSupabase.from = () => ({
    upsert: vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Network error') 
    }),
  });

  // Verify app continues to function
  // Verify user sees appropriate feedback
  // Verify no crashes or broken state
});
```

### Test Validation and Edge Cases

```typescript
test('should validate player names', async () => {
  // Test empty names
  await user.click(screen.getByRole('button', { name: /Start Game/i }));
  expect(screen.getByText(/Player names are required/i)).toBeInTheDocument();

  // Test duplicate names
  await user.type(screen.getByLabelText('Player 1 Name'), 'Alice');
  await user.type(screen.getByLabelText('Player 2 Name'), 'Alice');
  await user.click(screen.getByRole('button', { name: /Start Game/i }));
  expect(screen.getByText(/Player names must be different/i)).toBeInTheDocument();
});
```

## Performance Testing Considerations

### Clean Up After Tests

```typescript
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

afterAll(() => {
  mockConsoleError.mockRestore();
});
```

### Use Efficient Queries

```typescript
// Efficient - Direct query
screen.getByRole('button', { name: /Start Game/i });

// Less efficient - Multiple queries
screen.getAllByRole('button').find(btn => btn.textContent?.includes('Start Game'));
```

## Common Anti-Patterns to Avoid

### ❌ Testing Implementation Details

```typescript
// Bad - Testing internal state
expect(component.state.currentPlayer).toBe(0);

// Bad - Testing CSS classes
expect(element).toHaveClass('bg-blue-600');

// Bad - Testing component methods
expect(component.instance().calculateScore).toHaveBeenCalled();
```

### ❌ Overly Specific Selectors

```typescript
// Bad - Brittle selectors
container.querySelector('.player-card .score .value');

// Good - Semantic queries
screen.getByLabelText('Player score');
```

### ❌ Testing Everything in One Test

```typescript
// Bad - Monolithic test
test('should handle entire application workflow', () => {
  // 100 lines of test code testing everything
});

// Good - Focused tests
test('should start a new game');
test('should track player scores');
test('should handle game completion');
```

## Running Tests

### Single Test Files
```bash
npm test src/components/PlayerScoreCard.test.tsx
```

### Pattern Matching
```bash
npm test -- -t "specific test name"
```

### Watch Mode
```bash
npm test
```

### Coverage
```bash
npm run test:coverage
```

## Integration with CI/CD

Tests are automatically run on:
- Pull requests
- Pushes to main branch
- Before deployment

All tests must pass before code can be merged or deployed.

---

Remember: Good tests act as documentation for how your components should behave. They should be easy to read, understand, and maintain.