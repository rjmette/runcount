# Releasing RunCount

Publishing a `vX.Y.Z` GitHub Release fans out three deployments in parallel:

| Target       | Output                                     |
| ------------ | ------------------------------------------ |
| Web          | S3 + CloudFront (`runcount.rbios.net`)     |
| iOS / iPadOS | TestFlight                                 |
| Android      | Google Play internal testing track (draft) |

End-to-end takes ~10 minutes from `gh release create` to all three artifacts uploaded.

## Cutting a release

```sh
gh release create vX.Y.Z --generate-notes
```

Or via the GitHub UI: Releases → Draft a new release → tag `vX.Y.Z` → Publish.

The three workflows fire in parallel:

- [deploy.yml](.github/workflows/deploy.yml) — web → S3 + CloudFront (~3 min)
- [google-play.yml](.github/workflows/google-play.yml) — Android → Play internal track (~4 min on `ubuntu-latest`)
- [testflight.yml](.github/workflows/testflight.yml) — iOS → TestFlight (~7 min on the self-hosted Mac runner, plus Apple post-processing)

`workflow_dispatch` works the same way — versions are derived from the latest tag via `git describe`.

## Versioning

- **Marketing version** comes from the release tag (e.g. `v1.2.3` → `1.2.3`).
- **Build number / `versionCode`** comes from `${{ github.run_number }}` — monotonically increasing per repo run, satisfies App Store Connect and Play Store uniqueness rules.
- iOS `Info.plist` uses `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)` placeholders; the workflow passes both as `xcodebuild archive` build settings rather than editing Info.plist (which would be clobbered at archive time).
- Android `build.gradle` reads `ANDROID_VERSION_NAME` / `ANDROID_VERSION_CODE` from the environment, with sane defaults for local builds.

## One-time setup (already done for runcount)

- Capacitor 8 scaffolded with `appId: net.rbios.runcount`, iOS + Android projects added.
- iOS: `TARGETED_DEVICE_FAMILY = "1,2"` (iPhone + iPad), `IPHONEOS_DEPLOYMENT_TARGET = 15.0`, `DEVELOPMENT_TEAM = U4L88W98BS`, `ITSAppUsesNonExemptEncryption = false` in `Info.plist`.
- Capacitor configured with `ios.packageManager = "SPM"`.

## One-time setup still required

Before the first end-to-end release works, complete these (full instructions in [Mobile Distribution Setup](https://github.com/rbios/) SOP):

### Self-hosted Mac runner (percolator)

- Already registered for this repo with labels `[self-hosted, macOS]`.
- Xcode 26+ installed with iOS platform support (`xcodebuild -downloadPlatform iOS`).
- Running as a launchd service; the LaunchAgent plist has `SessionCreate` removed so codesign can reach the login keychain.

### Apple side

- Apple Developer Program membership active.
- Both agreements accepted: PLA (developer portal) and Paid/Free Apps Agreement (App Store Connect → Business).
- App Store Connect API key (Admin role) — `.p8` + Key ID + Issuer ID.
- App record exists in App Store Connect under bundle id `net.rbios.runcount`.

### Google side

- Google Play Developer account verified (identity + mobile device).
- App created in Play Console under package `net.rbios.runcount`.
- Google Cloud project with Play Developer API enabled; service account JSON key created.
- Service account invited to Play Console with: View app information, Release apps to testing tracks, Manage testing tracks and edit tester lists.
- **First AAB must be uploaded manually** (Play API rejects the first upload). Dispatch `google-play.yml` once, download the `app-release-aab` artifact, upload via Play Console → Internal testing → Create new release. Opt into App Signing by Google Play here. Future API uploads will then succeed.

### Android signing keystore

- Generated locally with `keytool -genkey -v -keystore runcount-release.jks ...`. Stored in `~/private_keys/` (or equivalent), `chmod 600`, backed up to a password manager with both passwords. **Losing this keystore means losing the ability to update RunCount on Play Store forever.**

### GitHub secrets

```
APP_STORE_CONNECT_API_KEY           # contents of the .p8 file
APP_STORE_CONNECT_API_KEY_ID        # 10-char ID
APP_STORE_CONNECT_API_ISSUER_ID     # UUID

KEYSTORE_BASE64                     # base64 of runcount-release.jks
KEYSTORE_PASSWORD
KEY_ALIAS
KEY_PASSWORD
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON    # the service-account JSON contents

# already present for the web deploy
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
VITE_SENTRY_DSN
```

Sanity check: `gh secret list` should show fresh timestamps for all of the above.

## Testing the install

### iOS (TestFlight)

1. Add testers in App Store Connect → TestFlight → Internal Testing → Testers (e.g. `ryan.mette@gmail.com`).
2. Install the TestFlight app on iOS device, sign in with that Apple ID.
3. Build appears within ~10 min of upload (after Apple processing).

### Android (Internal testing track)

1. Play Console → RunCount → Test and release → Internal testing → **Testers** tab → create email list with `ryan.mette@gmail.com`, **check the box to apply it to the test**.
2. Copy the opt-in URL from "How testers join your test".
3. Open URL on Android device (Play Store app, not Play Console app).
4. Tap **Become a tester** → **Download it on Google Play**.

Internal-test apps are not findable via Play Store search. Deep link:

```
https://play.google.com/store/apps/details?id=net.rbios.runcount
```

While the app is still in Play Console "draft" state, the upload script uses `status: 'draft'`. Once the app is past draft (privacy policy, content rating, screenshots, etc. completed), flip to `status: 'completed'` in [.github/workflows/google-play.yml](.github/workflows/google-play.yml) so internal-tester rollout happens automatically.

## Common gotchas

See the upstream SOP for the full table — the highlights:

| Symptom                                                                 | Fix                                                                                                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TestFlight build shows wrong version                                    | Already fixed: workflow passes `MARKETING_VERSION=` / `CURRENT_PROJECT_VERSION=` on `xcodebuild archive` rather than editing Info.plist. |
| "Missing Compliance" blocks TestFlight build from reaching testers      | Already fixed: `ITSAppUsesNonExemptEncryption=false` in Info.plist.                                                                      |
| `error: PLA Update available` during archive                            | Apple updated the PLA — re-accept at developer.apple.com/account.                                                                        |
| `403 FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED` during upload    | Re-accept the Paid/Free Apps Agreement in App Store Connect → Business.                                                                  |
| `codesign ... errSecInternalComponent` only when runner runs as service | Already addressed: percolator's LaunchAgent plist has `SessionCreate` stripped so codesign can reach the unlocked login keychain.        |
| Play upload fails with "Service account JSON length: 0 chars"           | `gh secret set < file` silently failed — re-pipe and verify `gh secret list` timestamp.                                                  |
| Tester opt-in URL says "App not available"                              | Tester not on the email list, list not checkboxed on the release, or release still in Draft.                                             |
