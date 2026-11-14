# AWA development build (`com.hawa.dev`): Metro and Fast Refresh

Status: **configuration implemented (Gate 1).** Installing the app on the phone and every other device-facing step below
still need their own approval. The commands are PowerShell and were not run when this document was written.

## What it is

A separate Android package, `com.hawa.dev` ("AWA Dev"), for daily React Native work: it loads its JavaScript from Metro
and shows UI edits immediately through Fast Refresh. It is **not** a way to look at the app as a user sees it; that is
still the release-like pilot.

| Variant | Application id | Launcher name | JavaScript comes from | Debuggable | Cleartext HTTP | Purpose |
|---|---|---|---|---|---|---|
| `release` | `com.hawa` | AWA | embedded bundle | no | no | production (not installed on the phone) |
| `debug` | `com.hawa.audit` | AWA Audit | embedded bundle (Metro takes over when reachable) | yes | yes | audit / validation with synthetic data |
| `pilot` | `com.hawa.pilot` | AWA Pilot | embedded bundle | no | no | release-like visual review |
| **`dev`** | **`com.hawa.dev`** | **AWA Dev** | **Metro only (no embedded bundle)** | yes | **yes** | **daily UI development** |

Isolation: a different application id means its own data directory, Android Keystore keys, Keychain entries, notification
channels, alarms, permissions and content-provider authorities (every authority is `<applicationId>.<name>`). The dev
app shares nothing with the other three, and starts with an empty sandbox.

## Why not the audit or the pilot build

- **Pilot:** `BuildConfig.DEBUG` is false, so React Native's dev support is never created and Metro cannot reach it
  ("No apps connected" is the expected message). It also forbids cleartext HTTP.
- **Audit:** it could connect to Metro, but it would then run the current working-tree JavaScript against the audit
  app's existing data (a different program from the one that wrote it, with start-up migration and recovery paths).
  Its embedded bundle is also what makes reminders and headless tasks work without Metro.

## What was configured

| File | Change |
|---|---|
| `android/app/build.gradle` | new `dev` build type (`applicationIdSuffix ".dev"`, `versionNameSuffix "-dev"`, `debuggable true`, debug signing, `matchingFallbacks = ['debug']`); `debuggableVariants = ["dev"]` (was `[]`) |
| `android/app/src/dev/AndroidManifest.xml` | `usesCleartextTraffic="true"` for the dev package only (Metro is served over HTTP) |
| `android/app/src/dev/res/values/strings.xml` | launcher name "AWA Dev" |
| `src/services/__tests__/androidDevVariant.test.ts` | guard for all of the above |
| `androidAuditVariant.test.ts`, `androidPilotVariant.test.ts` | one assertion each, updated for `debuggableVariants = ["dev"]` (the audit and pilot builds still bundle JS) |

`debuggableVariants` has one effect in the React Native Gradle plugin: variants in the list skip the JS bundle task.
Only `dev` is listed, so `debug`, `pilot` and `release` bundle JavaScript exactly as before. Port 8081 is the React
Native default and is not overridden anywhere (a test pins this).

## First time (gated)

```powershell
$adb    = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$serial = "BUEQY19527041001"

# 1. Build (arm64-v8a only; the first native debug build takes a while, later ones are incremental)
Set-Location D:\HAWA\mobile\android
.\gradlew.bat :app:assembleDev -PreactNativeArchitectures=arm64-v8a --offline
# output: D:\HAWA\mobile\android\app\build\outputs\apk\dev\app-dev.apk

# 2. Inspect before installing: package id, label, debuggable
& "$env:ANDROID_HOME\build-tools\35.0.0\aapt2.exe" dump badging "D:\HAWA\mobile\android\app\build\outputs\apk\dev\app-dev.apk" | Select-Object -First 1

# 3. Fresh install of the new package only: no -r, nothing existing is replaced
& $adb -s $serial install "D:\HAWA\mobile\android\app\build\outputs\apk\dev\app-dev.apk"
```

## Every work session

```powershell
# Terminal 1: Metro (leave it open)
Set-Location D:\HAWA\mobile
npx react-native start                 # add --reset-cache after dependency or babel changes

# Terminal 2: connect the phone to Metro over USB, then open the app
$adb    = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$serial = "BUEQY19527041001"
& $adb -s $serial reverse tcp:8081 tcp:8081
& $adb -s $serial reverse --list                                           # shows tcp:8081 tcp:8081
& $adb -s $serial shell am start -n com.hawa.dev/com.hawa.MainActivity    # or tap the "AWA Dev" icon
```

- Save a file in `src/` and the screen refreshes (Fast Refresh). Press `r` in the Metro window for a full reload, `d`
  for the dev menu, `j` for the debugger.
- Repeat `adb reverse` after unplugging the phone or rebooting it. Remove it with
  `& $adb -s $serial reverse --remove tcp:8081`.
- JavaScript edits never need a rebuild or a reinstall. A native or Gradle change does; an update install of the dev
  package would then be `install -r` for `com.hawa.dev` only (keeps its data) and needs its own approval.
- Avoid `npx react-native run-android --mode dev`: it builds, installs and launches in one step.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| "Unable to load script" red screen | Metro is not running, or `adb reverse` is missing. The dev app has **no** embedded bundle by design. |
| Metro prints "No apps connected" | no dev-support app is running: the app is closed, or you are looking at the pilot or release build, which cannot connect |
| Port 8081 busy | another Metro is running; close it rather than moving the port (the app is set to 8081) |
| Edits to a locale file do not show | i18next resources are not hot-swapped; press `r` |
| Stale code after changing dependencies | restart Metro with `--reset-cache` |
| Yellow or red overlays on screen | dev mode warnings; they never appear in the pilot or release builds |

## Limits

- **Dev mode is not the final look.** It runs development JavaScript with warning overlays and slower rendering. Judge
  typography, spacing and weights on the pilot.
- **First-run screens (Welcome, Name) appear once per sandbox.** After you finish onboarding in the dev app they are not
  reachable again there. Resetting means clearing or reinstalling `com.hawa.dev` only, which needs your explicit
  approval each time under the current device rules.
- **Metro bundles your whole uncommitted working tree**, so the dev app always runs exactly what is on disk.
- **26 `__DEV__` branches** exist in the app, almost all `console.log`; one visible difference is the dev-only
  "Prévisualiser le parcours partenaire" button on the AwaADeux pending screen.
- **Never distribute the dev APK**: it is debuggable, allows cleartext HTTP and is debug-signed. Use test data only.
- **Never** point it at, clear, or reinstall `com.hawa.audit`, `com.hawa.pilot` or `com.hawa`.

## Checks performed for Gate 1 (configuration level only: no build, no device contact)

| Check | Result |
|---|---|
| Resolved variants (AGP 8.9.2) | `dev` = `com.hawa.dev`, `1.0-dev`, debuggable, fallback `debug`; `debug`, `pilot`, `release` identical to before |
| JS bundle task per variant (dry run) | absent for `dev`; present for `debug`, `pilot`, `release` |
| `devRuntimeClasspath` against `debugRuntimeClasspath` | identical resolved trees (18 project dependencies each) |
| `defaultConfig`, `signingConfigs`, `debug`, `pilot`, `release`, `dependencies` blocks | identical to the file before this step |
| Android guard tests | audit, pilot and dev suites pass |
