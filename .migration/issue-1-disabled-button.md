## Summary
A scoring action button (score/foul/safety/miss/undo) appears disabled during active gameplay when it should be tappable.

## Context
Happens in the main scoring interface while logging shots. Intermittent or state-dependent.

## Reproduction Steps
1. Start a game
2. Begin logging shots
3. Observe which action becomes disabled unexpectedly during an inning

## Expected Behavior
All relevant actions remain enabled when appropriate for the current game state.

## Actual Behavior
One action is disabled unexpectedly.

## Affected Components
Scoring UI components that control button disabled states.

## Technical Notes
- Review disabled prop conditions tied to game state (e.g., inning active, break shot, canUndo)
- Confirm that undo is only disabled when no history is present, and others reflect rule state correctly
- Add analytics/logs around disabled transitions to pinpoint cause

## Acceptance Criteria
- [ ] Buttons only disable based on explicit, correct state
- [ ] No unexpected disables during gameplay
- [ ] Unit tests cover disabled logic

## References
Related to UI/UX improvements

---
_Migrated from Todoist (RunCount project)_
