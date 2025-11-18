## Summary
Social login via Supabase OAuth fails for Google and Apple providers.

## Context
`Login.tsx` uses `supabase.auth.signInWithOAuth` with `redirectTo: window.location.origin`. Providers configured: google, apple.

## Reproduction Steps
1. Navigate to Login screen
2. Click "Continue with Google" or "Continue with Apple"
3. Observe failure (no session, error, or unexpected redirect)

## Expected Behavior
Successful OAuth flow returns authenticated session and redirects back to app.

## Actual Behavior
Fails to authenticate/redirect.

## Affected Components
- `src/components/auth/Login.tsx` (handleSocialLogin function)
- Supabase project OAuth settings

## Technical Notes
- Use a dedicated callback: `redirectTo: ${window.location.origin}/auth/callback` and add this URI in Supabase provider settings
- Verify Supabase configuration:
  - Enable providers
  - Add allowed origins/redirects for dev (`http://localhost:3000`) and prod (`https://runcount.rbios.net`) domains
  - For Apple: configure Services ID, redirect URL, Key ID, Team ID
- Ensure the OAuth call executes within a user gesture (popup/redirect constraints)
- Add robust error surfacing (show provider error.message) and console logs gated to dev environment
- Test matrix: Chrome, Safari (incl. iOS), Firefox; mobile and desktop

## Acceptance Criteria
- [ ] Google sign-in works in dev and prod
- [ ] Apple sign-in works in dev and prod
- [ ] Session persists after successful OAuth
- [ ] Regressions covered by integration test
- [ ] Error messages are user-friendly

## References
- `src/components/auth/Login.tsx`
- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)

---
_Migrated from Todoist (RunCount project)_
