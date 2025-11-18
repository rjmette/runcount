## Summary
Execute comprehensive test plan for BreakFoulModal penalty options under straight pool rules.

## Test Plan
Verify the new break foul modal in RunCount app works correctly:

1. Start a new game and cause a break foul
2. Check that modal shows two penalty options: "Scratch on Legal Break (-1 point)" and "Illegal Break (-2 points)"
3. Test that selecting different penalties updates the action button text
4. Verify that accepting table or requiring re-break applies correct penalty to player score
5. Test that re-breaks work correctly with selected penalty
6. **NEW**: Test cancel functionality - click X button in header to undo the foul

## Implemented Features
- Separate 1-point and 2-point foul options per straight pool rules
- UI defaults to -2 point (illegal break) penalty
- Penalty selection affects both "Accept table" and "Require re-break" options
- **Cancel/Undo functionality**: Clean X button in modal header to undo accidental fouls
- All tests passing and builds successfully
- Removed redundant alert dialog for cleaner UX
- Clean, minimal UI with just the essential controls

## Acceptance Criteria
- [ ] All 6 test scenarios pass
- [ ] Penalty options correctly apply -1 or -2 points
- [ ] Re-break flow works with selected penalty
- [ ] Cancel/undo functionality works correctly
- [ ] No regressions in scoring logic
- [ ] UI is clear and intuitive
- [ ] Test notes documented

## References
Break foul handling per straight pool rules

---
**Due Date:** 2025-09-20  
_Migrated from Todoist (RunCount project)_
