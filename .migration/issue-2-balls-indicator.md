## Summary
Move the "balls on table" indicator to free screen space for larger Undo and Inning buttons, improving touch accessibility on mobile.

## Context
Current indicator likely overlaps prime touch area. Related file: `src/components/GameScoring/components/BallsOnTableModal.tsx`

## Requirements
- Increase Undo/Inning button touch targets to ≥ 44–48 px minimum touch size
- Relocate indicator (e.g., top area, toolbar, collapsible panel) without reducing visibility
- Maintain readability and theming in light/dark modes

## Affected Components
- `src/components/GameScoring/components/BallsOnTableModal.tsx`
- Undo and Inning button components

## Acceptance Criteria
- [ ] Indicator relocated to non-conflicting screen position
- [ ] Undo/Inning buttons enlarged and comfortably tappable on small devices (iPhone SE/Pixel 5)
- [ ] No layout regressions in desktop or tablet views
- [ ] Dark mode compatibility verified

## References
Mobile usability enhancement

---
_Migrated from Todoist (RunCount project)_
