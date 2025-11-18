## Summary
"Copy results" intermittently fails on iOS/Android devices.

## Context
GameStatusPanel uses `src/utils/copyToClipboard.ts` which includes Clipboard API and execCommand fallbacks with iOS-specific handling.

## Reproduction Steps
1. Complete a game on iOS Safari or Android Chrome (including WebView)
2. Tap "Copy results" button
3. Attempt to paste into notes app
4. Observe failure cases

## Expected Behavior
Content is copied reliably on supported browsers when invoked from a user gesture.

## Actual Behavior
Copy sometimes fails or returns no-op, leaving clipboard empty.

## Affected Components
- `src/utils/copyToClipboard.ts`
- `src/components/shared/GameStatusPanel.tsx` (caller)

## Technical Notes
- Ensure the copy call occurs synchronously within the user gesture; avoid awaiting async work before invoking copy
- On iOS 16+/17, verify secure context and gesture requirements; consider ClipboardItem path for future-proofing
- Revisit iOS range selection and selection clearing; verify readOnly/selectability tricks
- Instrument success/failure telemetry and surface user feedback consistently (toast/snackbar)
- Check that the copy handler is directly bound to the button click, not wrapped in async operations

## Acceptance Criteria
- [ ] 100% success in manual tests on iOS Safari (current + n-1 versions)
- [ ] 100% success on Android Chrome
- [ ] Robust success/failure feedback shown to user
- [ ] Unit test stubs for clipboard utility
- [ ] E2E test on WebKit covering copy flow

## References
- `src/utils/copyToClipboard.ts`
- `src/components/shared/GameStatusPanel.tsx`

---
_Migrated from Todoist (RunCount project)_
