# Russian (ru) — Android device validation: preparation and safe procedure

Status: PREPARATION ONLY. Nothing below has been run. No APK was built, installed or launched, and the phone was
not accessed while writing this. Every device step needs its own explicit approval.

Test target: the isolated audit app `com.hawa.audit` (debug variant, bundled JS) on the Huawei MAR-LX1M
(serial `BUEQY19527041001`, Android 10). The production app `com.hawa` is never started, replaced or modified.
Use the checklist in `russian-manual-android-test-checklist.md` for what to look at.

## 1. What was verified (local files only)

| # | Item | Result |
|---|---|---|
| 1 | Audit variant configuration | `android/app/build.gradle`: `defaultConfig.applicationId "com.hawa"`, `buildTypes.debug { applicationIdSuffix ".audit"; versionNameSuffix "-audit" }`, `release` has no suffix, `namespace "com.hawa"`, `versionCode 1`, `debuggableVariants = []` (JS bundled, no Metro needed). Unchanged since the installed audit APK was built. |
| 2 | `com.hawa` stays untouched | Different package id ⇒ separate UID, data dir, Keystore keys, channels, alarms. Every device command below names `com.hawa.audit`; none names `com.hawa`. The only commands that read `com.hawa` are two read-only `dumpsys` baselines (section 5), to prove it did not change. |
| 3 | Application id and signing of the new build | Expected `com.hawa.audit`, versionName `1.0-audit`, versionCode 1. Both build types sign with `android/app/debug.keystore`. The APK on disk (built 14:30, sha256 `27abc14af260…a7a5`, the one installed on the phone) is signed by `CN=Android Debug`, cert SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`; the release `com.hawa` APK has the same certificate. The rebuilt APK must show this same digest (check in section 4). |
| 4 | Does an update keep audit data? | **Yes**, if installed with `adb install -r` over the same package id and signature: `/data/data/com.hawa.audit` (AsyncStorage, Keychain datastore, notifee database), the Android Keystore key, runtime permissions and notification-channel settings all survive. Same `versionCode 1` is accepted by `-r`. Uninstall, `pm clear`, "Clear storage" or `-d` are NOT used. |
| 5 | Checklist reviewed | Reviewed; one correction made (the failure signature of the Hermes plural test, section 7). The decisive plural counts are 0, 5, 11, 21. |

## 2. Differences between the installed audit build and the new build

Files changed since the installed APK was built (14:30): Russian dictionary and language wiring, the 72 article
`ru:` blocks, `pregnancyWeekData.ts`, `LegalDocumentScreen.tsx`, `pluralRules.ts`, the Cyrillic PDF font and
`medicalExportPdf.ts`, `cycleMath.ts`, `themePreferences.ts`, editorial image alt text, `jest.config.js` (tests only).
Not changed: `App.tsx`, `index.js`, every file in `state/`, `services/` (other than the PDF), encryption,
notification scheduling and all Android sources. `android/app/build.gradle` was touched only by a test mutation that
was restored byte for byte (the `.audit` suffix is still there).

## 3. Risks for startup, migrations and existing audit data

| Risk | Assessment |
|---|---|
| Structured-data (Phase 9) migration | None pending: the audit app was installed fresh on 2026-10-11 and has only ever written through the encrypted path; the encryption format, key service and migration code are unchanged. `runStructuredMigration()` will find nothing plaintext. It still runs at boot (as on every launch). |
| Field-level note migrations | Same: nothing legacy exists in this sandbox. |
| Language preference | `@awa/appearance/language-v1` is plaintext, additive (`'ru'` becomes a valid value). The current value (English) is preserved; you select Русский yourself. |
| `MY_PACKAGE_REPLACED` | `adb install -r` makes Android deliver this broadcast to the audit app's receiver, which starts the headless reminder resync WITHOUT a launch. It only re-arms the audit app's own reminders (same ids, same times), in its own storage. Expected, harmless, and the first observable side effect after install. |
| The 15:20 Daily Journal reminder from the earlier test | Probably still scheduled (daily) — the audit phone may notify again tomorrow at 15:20 until you switch it off in the audit app. |
| Installed size and time | The APK is about 523 MB (four ABIs). Needs roughly 1–1.2 GB free on the phone; transfer takes minutes. A Huawei "install via USB / virus scan" dialog may need a tap on the phone. `INSUFFICIENT_STORAGE` leaves everything unchanged. |
| Signature mismatch | Impossible by construction (same keystore, same machine). If `INSTALL_FAILED_UPDATE_INCOMPATIBLE` ever appears: STOP. Never uninstall to "fix" it. |
| Hermes plurals | The new behaviour is the PluralRules fallback; it is unproven on the device until section 7 passes. |
| Rollback | The previous APK (sha256 `27abc14a…`) is backed up before rebuilding (section 4). Installing it with `-r` is allowed (same versionCode, not a downgrade) and keeps data. If Russian had been selected, the older build ignores the unknown stored value and shows English. |

## 4. Build procedure (no device involved; approval needed to run it)

Run from `D:\HAWA\mobile\android` in a normal terminal. Nothing here changes any source or build file.

1. **Back up the installed APK** (the rebuild overwrites `app-debug.apk`):
   copy `app\build\outputs\apk\debug\app-debug.apk` (about 523 MB) to a folder OUTSIDE the repo, e.g.
   `C:\Users\DELL\awa-audit-apk-backup\audit-2026-10-11-1430.apk`, and check that its sha256 is
   `27abc14af260381e0f492325cda742c4b80ea3e4de765171b56a6eead92ea7a5`.
2. **Pre-checks:** `git status` shows the expected working tree; `npx tsc --noEmit` is clean; no `npm install`.
3. **Build:**
   ```
   .\gradlew.bat :app:assembleDebug --offline -x lint
   ```
   (the same command as the previous audit build; about 4–5 minutes, it bundles JS with Hermes).
   Optional, ONLY after the phone's ABI is confirmed arm64 with a read-only `adb shell getprop ro.product.cpu.abilist`
   (approved separately): append `-PreactNativeArchitectures=arm64-v8a` to cut the APK to roughly a quarter. This is a
   command-line property, not a build-file change.
4. **Verify the artifact locally** (`app\build\outputs\apk\debug\app-debug.apk`, `output-metadata.json`):
   - `aapt2 dump badging app-debug.apk | head -1` → `package: name='com.hawa.audit' versionCode='1' versionName='1.0-audit'`
   - `apksigner verify --print-certs app-debug.apk` → SHA-256 digest `fac61745…3b9c` (same as the installed one)
   - `assets/index.android.bundle` present; `sha256` recorded and reported.
   - `app-release.apk` (package `com.hawa`) is NOT used and NOT rebuilt.

## 5. Install procedure (each numbered step needs explicit approval)

| Step | Command (serial `BUEQY19527041001`) | Class | Expected |
|---|---|---|---|
| 5.1 | `adb devices -l` | read-only | one device, state `device` |
| 5.2 | `adb -s … shell pm list packages \| findstr hawa` | read-only | `com.hawa` and `com.hawa.audit` |
| 5.3 | `adb -s … shell dumpsys package com.hawa.audit \| findstr /i "versionName versionCode firstInstallTime lastUpdateTime"` | read-only baseline | `1.0-audit`, `firstInstallTime` = 2026-10-11 15:09 |
| 5.4 | `adb -s … shell dumpsys package com.hawa \| findstr /i "versionName firstInstallTime lastUpdateTime"` | read-only baseline | `1.0`, install 2026-10-10 19:16, update 2026-10-10 19:22 |
| 5.5 | `adb -s … install -r "<repo>\mobile\android\app\build\outputs\apk\debug\app-debug.apk"` | **install (audit only)** | `Success` (accept a Huawei prompt on the phone if shown) |
| 5.6 | repeat 5.3 and 5.4 | read-only verify | audit `lastUpdateTime` is new, **`firstInstallTime` unchanged** (= data preserved); `com.hawa` lines **identical** to 5.4 |

Never use: `adb uninstall`, `pm clear`, `-d`, `-g`, `adb install` without `-r`, anything naming `com.hawa`.
No launch, notification, clock, time-zone or battery action is part of this install. Launching the audit app is a
separate approval.

## 6. After the install (separate approvals)

1. Launch `com.hawa.audit` only (`am start -W -n com.hawa.audit/com.hawa.MainActivity`), read-only log review:
   no `FATAL EXCEPTION`, `ReactNativeJS: Running "HAWA"`, no redbox, no keychain/migration errors beyond the
   benign "No entry found" for never-set PIN entries.
2. You operate the phone for the checklist; I can read `logcat -d` and `dumpsys` (read-only) between steps.

## 7. How to validate the specific risks

- **Plurals on Hermes (decisive):** open the Qadaa add-days form and step the quantity through **0/1, 5, 11, 21,
  22, 25**; read the CTA «Добавить N … для восполнения». Expected 1 → «день», 2–4 → «дня», 5 → **«дней»**, 11 → «дней»,
  21 → **«день»**, 22 → «дня». Without the fallback every count except 1 shows «дня», so «5 дня», «11 дня»,
  «21 дня» (and «0 дня») are the failure. 2, 3 and 4 look right either way and prove nothing.
  Corroborate with the Qadaa hero label «…дней для восполнения» and Statistics «N дней с записями».
- **Language persistence:** select Русский → Apply → force-stop → relaunch (still Russian from the first frame) →
  switch profile (unchanged) → reboot is NOT required. Check that nothing else (cycle data, reminders) changed.
- **Layout:** 360 dp class phone at default and largest font; tab labels, journal chips, onboarding CTAs, premium
  sheet, calendar header (Пн–Вс); screenshot anything clipped (the checklist, section 4).
- **Notifications:** a reminder 5–10 minutes ahead, phone idle and app backgrounded (not force-stopped); title/body
  Russian; user-typed titles unchanged; switch RU → EN → RU with a pending reminder: same time, new text; a
  delivered notification is not removed. Clock and time zone are not changed.
- **Cyrillic PDF:** Profile → export a report with synthetic data in Russian; open the PDF. The file lives in the
  app cache (`cache/medical-export/`, replaced on the next export). For text/font inspection on the PC I can, with
  your approval, read it read-only through `run-as com.hawa.audit` right after creation and check the embedded
  fonts (`DejaVuSans`, `DejaVuSans-Bold`) and extracted text; on the phone just check glyphs, bold headings,
  wrapping and the date format «25 августа 2026 г.».

## 8. Approvals needed (in order)

1. Backup + build (local, no device): 4–5 minutes.
2. Read-only device baseline (5.1–5.4).
3. `adb install -r` of the audit APK (5.5), then the read-only verification (5.6).
4. Launch of `com.hawa.audit` and log review (section 6).
5. Each notification / time-sensitive test step; any clock, time-zone or battery change is excluded unless you
   approve it separately.
