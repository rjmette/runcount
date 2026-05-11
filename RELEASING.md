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

## One-time setup (all done for runcount as of 2026-05-10)

### Project

- Capacitor 8 scaffolded with `appId: net.rbios.runcount`, iOS + Android projects added.
- iOS: `TARGETED_DEVICE_FAMILY = "1,2"` (iPhone + iPad), `IPHONEOS_DEPLOYMENT_TARGET = 15.0`, `DEVELOPMENT_TEAM = U4L88W98BS`, `ITSAppUsesNonExemptEncryption = false` in `Info.plist`.
- Capacitor configured with `ios.packageManager = "SPM"`.

### Self-hosted Mac runner (percolator)

- Registered on `rjmette/runcount` with labels `[self-hosted, macOS]` (separate runner directory from tiny-tanks; both coexist).
- Xcode 26+ with iOS platform support installed.
- Running as a launchd service; LaunchAgent plist has `SessionCreate` removed so codesign can reach the login keychain.

### Apple

- Apple Developer Program membership active; both agreements accepted (PLA + Paid/Free Apps).
- App Store Connect API key (Admin role) reused from prior tiny-tanks setup — keys are account-wide.
- App record exists in App Store Connect under bundle id `net.rbios.runcount`.
- **Xcode Cloud workflow deactivated** in App Store Connect → Xcode Cloud → Manage Workflows (it ran in parallel with our GitHub Actions pipeline and kept failing because it doesn't run `npm ci` + `cap sync` before `xcodebuild`).

### Google

- Play Developer account verified.
- App created in Play Console under package `net.rbios.runcount`.
- Google Cloud project `rbios-play` with the Play Developer API enabled.
- Service account `rbios-play-publisher@rbios-play.iam.gserviceaccount.com` granted Play Console access for RunCount (View app information, Release apps to testing tracks, Manage testing tracks and edit tester lists; no production access).
- **No manual AAB seed required** — the Play Developer API now accepts the first upload for a new package directly. (Older docs say otherwise; that's stale.)

### Android signing keystore

- Generated as `~/private_keys/runcount-release.jks` with alias `runcount`, `chmod 600`. Backed up to 1Password with both passwords and the `.jks` file as an attachment. **Losing either ends RunCount's ability to update on Play Store forever.**

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

1. Testers managed in App Store Connect → TestFlight → Internal Testing → Dev Team group (currently includes `ryan.mette@icloud.com` — note the Apple ID is the iCloud one, not the gmail one).
2. Install the TestFlight app on iOS device, sign in with that Apple ID.
3. Build appears within ~10 min of upload (after Apple processing). If the new build doesn't show as an update, **force-quit and relaunch TestFlight** — sometimes the in-app list is cached. Make sure new tag versions monotonically increase past the highest existing TestFlight marketing version, otherwise TestFlight won't surface it as an update.

### Android (Internal testing track)

1. Testers managed in Play Console → RunCount → Test and release → Internal testing → **Testers** tab → `RunCount Internal Testers` email list (currently `ryan.mette@gmail.com`); list is checkboxed to apply to the track.
2. One-time tester opt-in URL: https://play.google.com/apps/internaltest/4701580677381473357 — open on Android device (Play Store app, not Play Console app), tap **Become a tester** → **Download it on Google Play**. After that initial opt-in, future releases just appear as updates in Play Store.

Internal-test apps are not findable via Play Store search. Deep link:

```
https://play.google.com/store/apps/details?id=net.rbios.runcount
```

The upload script tries `status: 'completed'` first (auto-rolls out to internal testers, no Play Console click required). While the app is still in Play Console draft state the API rejects that, so the script automatically falls back to `status: 'draft'` and logs a message telling you to promote it manually via Play Console → Internal testing → Edit release → Save and publish. Once you complete the Play Console store-listing tasks (privacy policy, content rating, screenshots) and the app exits draft state, the `completed` path starts working automatically — no workflow change required.

## Common gotchas

See the upstream SOP for the full table — the highlights:

| Symptom                                                                                                      | Fix                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TestFlight build shows wrong version                                                                         | Already fixed: workflow passes `MARKETING_VERSION=` / `CURRENT_PROJECT_VERSION=` on `xcodebuild archive` rather than editing Info.plist.                                                                                                           |
| "Missing Compliance" blocks TestFlight build from reaching testers                                           | Already fixed: `ITSAppUsesNonExemptEncryption=false` in Info.plist.                                                                                                                                                                                |
| `error: PLA Update available` during archive                                                                 | Apple updated the PLA — re-accept at developer.apple.com/account.                                                                                                                                                                                  |
| `403 FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED` during upload                                         | Re-accept the Paid/Free Apps Agreement in App Store Connect → Business.                                                                                                                                                                            |
| `codesign ... errSecInternalComponent` only when runner runs as service                                      | Already addressed: percolator's LaunchAgent plist has `SessionCreate` stripped so codesign can reach the unlocked login keychain.                                                                                                                  |
| Play upload fails with "Service account JSON length: 0 chars"                                                | `gh secret set < file` silently failed — re-pipe and verify `gh secret list` timestamp.                                                                                                                                                            |
| Tester opt-in URL says "App not available"                                                                   | Tester not on the email list, list not checkboxed on the release, or release still in Draft.                                                                                                                                                       |
| New TestFlight build doesn't surface as an update on the phone                                               | Marketing version must monotonically increase past the highest existing TestFlight version. Going down (e.g. 1.0 → 0.1.0) still installs but won't show as an update — force-quit and relaunch TestFlight to see it under its own version section. |
| iOS build fails with `CFBundleShortVersionString must be composed of one to three period-separated integers` | The release tag had a prerelease suffix (e.g. `v0.1.0-rc1`). [.github/workflows/testflight.yml](.github/workflows/testflight.yml) now strips the suffix automatically.                                                                             |
