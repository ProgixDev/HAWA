# AWA — Development TODO

**Last audit date:** 2026-08-22 (§1.18 Library figures re-verified and corrected 2026-08-29)
**Project:** AWA (Hawa)
**Platform:** React Native CLI / Android
**Source of truth:** Cahier des charges fonctionnel (pasted in-session, no file existed in repo) + full repository audit (code inspection, not assumption)

> This document was produced by a read-only audit. No application code was modified to produce it. Every ✅/🟡/⬜/🔴 verdict below is backed by an actual file read, not inferred from a screen/file merely existing.

## Status legend

- `[x]` Done — real, working implementation found and verified
- `[ ]` Todo — not implemented at all
- `[~]` Partial — implemented but incomplete, inconsistent, or stubbed in part
- `[!]` Blocked / dependency — cannot be finished without another decision or system (usually backend) first

## Labels

`FRONTEND` `BACKEND` `SECURITY` `PREMIUM` `FREE` `RELIGIOUS-CONTENT` `MEDICAL` `PRIVACY` `FUTURE`

---

# 1. FRONTEND

## 1.1 Authentication & Onboarding

- [x] Splash screen (`SplashScreen.tsx`) — animated logo/timer, calls `requiresAppLock()`. `FRONTEND`
- [ ] Splash → route based on "already onboarded" state — no `hasCompletedOnboarding` flag exists anywhere in the codebase; every cold start goes Splash → Welcome regardless of existing user data. `FRONTEND`
- [x] Login screen (`AuthScreen.tsx`) — real frontend validation now complete: email required/trimmed/whitespace-rejected/format-checked, password required, inline errors under each field reusing the app's established red-border/red-text convention (`PersonalInformationScreen.tsx`'s pattern). On fully valid input the screen shows an honest informational message ("La connexion sera disponible avec l'activation du service d'authentification.") — it does NOT navigate to MainTabs and does NOT claim login success. Google/Apple/E-mail buttons remain inert `Alert.alert(...)`, unchanged. `FRONTEND`
- [ ] Real Login authentication — no backend/API exists to verify credentials; `AuthScreen.tsx`'s now-validated submit has nowhere real to authenticate against. `BACKEND`
- [x] `DEV-ONLY / NOT PRODUCTION AUTHENTICATION` — Login/Registration developer bypass — `AuthScreen.tsx` and `RegistrationScreen.tsx` each have a `{__DEV__ ? ... : null}`-gated "Continuer en mode développement" action (dashed, muted, visually distinct from the real CTA) that does nothing but `navigation.replace('MainTabs', {screen: 'CycleHome'})` — no account/token/auth state is written, `anonymousMode` is untouched, and it never renders in a release build. Exists solely so the rest of the app (Cycle/Conceive/Pregnancy/Postpartum/Loss/Calendar/Statistics/Journal/Notifications/Settings) can keep being tested while real authentication is unimplemented. This does **not** count toward "Real Login authentication" / "Real account creation" below — those remain `BACKEND`. `FRONTEND` `DEV-ONLY`
- [x] Registration screen (`RegistrationScreen.tsx`) — real client-side validation now hard-gates submission (previously cosmetic-only): email required/format, the existing password-rule checklist (length/digit/uppercase/special char), and password-confirmation match are all enforced before proceeding, surfaced as inline errors (no more `Alert.alert` for validation). A `submitting` guard prevents double-submission around the screen's one genuine local write (`updatePersonalInformation({firstName})`, the canonical `personalInformationStore.ts` — no longer the old non-persisted `onboardingPreferences` mirror). On a fully valid submit it shows an honest informational message and no longer navigates to MainTabs, no longer flips `anonymousMode`, and does not claim "Compte créé." `FRONTEND`
- [ ] Real account creation — no backend/API exists; a locally valid Registration form does not create an account anywhere. `BACKEND`
- [x] Forgot-password screen (`ForgotPasswordScreen.tsx`) — real email validation (required/trimmed/format-checked) with inline errors; the previous fake "Lien envoyé" success alert has been removed entirely. On valid input it shows an honest informational message and does not claim a reset e-mail was sent. `FRONTEND`
- [ ] Real reset-password e-mail delivery — no e-mail/backend service exists to actually send anything. `BACKEND`
- [ ] Email verification flow — zero code found anywhere (no OTP/verification screen, no store). `FRONTEND` `BACKEND`
- [x] Anonymous mode (no email required) — real, working, spec-compliant: `AuthScreen` → `AnonymousModeScreen` → `AnonymousModeLimitationsScreen` → `AnonymousModeCreatingScreen` (genuine loading/error/retry UX) → `AnonymousModeSuccessScreen` → `AnonymousAvatarCustomizerScreen`. Generates a real stable local ID (`ensureAnonymousAccount()` in `securityPreferences.ts`). `FRONTEND` `PRIVACY`
- [~] Anonymous vs. registered account differentiation — the toggle and ID generation are real; `RegistrationScreen.tsx` no longer flips `anonymousMode` off on a locally-valid submit (removed — doing so without a real account would have falsely represented her as registered), so there is currently no path that changes this flag outside Settings. Will need re-validation once real accounts exist. `FRONTEND` `!` `BLOCKED-ON-BACKEND`
- [x] Full onboarding funnel — real, multi-step, branches correctly per objective (Splash→Welcome→Objective→Confirmation→SpiritualPreferences→[Location]→objective-specific steps→SecuritySetup→Privacy→Summary→Auth→MainTabs). `FRONTEND`
- [ ] "Skip onboarding for returning user" — no completion flag persisted; a user who already onboarded is not automatically routed past Welcome/Objective again. `FRONTEND`
- [x] Objective selection screen (`ObjectiveScreen.tsx`) — **product decision made: keep all 8 objectives as onboarding-time equals** (Cycle/Conceive/Contraception/Irregular-SOPK/Menopause/Pregnancy/Postpartum/Loss) — do not restrict to 4, do not hide/merge/relocate Pregnancy/Postpartum/Loss/Menopause. Audited and confirmed correct: all 8 map 1:1 to the `ObjectiveId` union in `ObjectiveScreen.tsx`, persist correctly via `setSelectedObjective()`/`onboardingPreferences.ts` (real AsyncStorage-backed, hydrated on boot), and are consistently represented in `CycleObjectiveConfirmationScreen.tsx`/`objectiveConfirmationContent.ts` (one shared screen, `Record<ObjectiveId, ...>` content — TypeScript enforces all 8 present) and `ProfileScreen.tsx`'s "Mon objectif" switcher (same 8, correct routing). Minor, non-blocking cosmetic note: `ProfileScreen.tsx`'s `OBJECTIVE_LABELS` record says "Suivi post-partum" where the onboarding picker and the switcher UI itself both say "Post-partum" — a secondary label string, not a missing/broken objective. `FRONTEND`
- [x] Spiritual markers opt-in (`SpiritualPreferencesScreen.tsx`) — **product decision resolved: explicit opt-in required, no default.** A brand-new user now sees no choice pre-selected; "Suivant" stays disabled (same dimmed-button convention used elsewhere in onboarding) until she taps "Oui, activer" or "Non, pas maintenant," so the untouched internal default can never be silently persisted as a deliberate choice. `onboardingPreferences.ts` tracks this via a provenance flag (`hasConfirmedSpiritualMarkersChoice`, in-memory only, no new AsyncStorage key) — true once a real choice is made (onboarding or Settings) or once migrated from an existing install's already-persisted value. Existing users' persisted `true`/`false` is preserved exactly, never reset or re-prompted. `getSpiritualMarkersEnabled()` still returns a plain boolean unchanged for all 8 existing consumers (dashboards, Library, Nifas reminders, Settings, Summary) — the unanswered state is scoped entirely to onboarding. Editable later in Settings (`ProfileScreen.tsx`, unaffected by this change). All 8 objectives' onboarding routing confirmed unchanged. `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Profile creation at onboarding — a lightweight, optional "Comment souhaites-tu qu'AWA t'appelle ?" step (`NameOnboardingScreen.tsx`) now exists inside the onboarding funnel, inserted once after `CycleObjectiveConfirmationScreen` for all 8 objectives. It reads/writes the canonical persisted `preferredName` field in `personalInformationStore.ts` — the same source `PersonalInformationScreen.tsx`/`ProfileScreen.tsx`/`HomeHeader.tsx` already use, so there is no duplicate name state. Detailed profile editing still lives in Settings (`PersonalInformationScreen.tsx`), unchanged. `FRONTEND`. Backend account/profile synchronization remains a separate, unimplemented requirement — see the backend plan in §2.
- [x] Validation / loading / error states across auth screens — Login, Registration, and Forgot Password now all have real frontend field validation, consistent inline errors, and honest submission UX (no fake success, no fake navigation, no fake `setTimeout` loading). Registration's one genuine local write is double-submit-protected via a `submitting` guard; Login/Forgot-Password have no real async operation, so none was faked. `AnonymousModeCreatingScreen`'s dedicated loading/error/retry UX is unaffected. `FRONTEND`. Real authentication, account creation, and reset-e-mail delivery remain separate `BACKEND` items above.

## 1.2 Objective System

- [x] 8 objectives exist as a typed `ObjectiveId` union, correctly persisted and switchable (`ProfileScreen.tsx` → "Mon objectif"). `FRONTEND`
- [x] Objective-aware routing triad (`HomeScreen.tsx` / `ObjectiveAwareCalendarScreen.tsx` / `ObjectiveAwareStatisticsScreen.tsx` / `MainTabNavigator`'s `JournalSheetHost`) — dedicated branches exist for `pregnancy`, `postpartum`, `loss`, `conceive`, `contraception`, and (as of this session) `menopause`. `FRONTEND`
- [x] Dedicated Dashboard/Calendar/Journal/Statistics for `irregular` (SOPK) — implemented this session (see §1.7 for full detail); no longer falls through to the generic Cycle screens. All 8 objectives now have dedicated routing triad branches. `FRONTEND`
- [x] Per-objective persisted preferences — each implemented objective (Cycle/Conceive/Pregnancy/Postpartum/Miscarriage) has its own dedicated AsyncStorage-backed store, no cross-contamination confirmed. `FRONTEND`
- [x] Empty states — confirmed present and honest (no fake data) in Conceive/Miscarriage Statistics ("Pas encore de données"), Cycle Calendar, etc. `FRONTEND`

## 1.3 Classic Cycle Tracking

- [x] Period start/end, menstrual duration, cycle duration, flow intensity — `onboardingPreferences.ts` (`CyclePreferences`, `PeriodHistoryRecord[]`), real accumulating history, not a single pointer. `FRONTEND`
- [x] Next-period / fertile-window / ovulation estimation from **personal history**, not a flat 28-day assumption — `computeCyclePredictionStatus()` in `cycleMath.ts` uses `exact` (learned average from real history) / `window` (26–32 day honest range for irregular/unknown patterns) / `observing` (still gathering data) modes. Verified this session. `FRONTEND`
- [x] Gregorian / Hijri / double calendar display — `MonthCalendarCard.tsx`, calendar-mode switch, ICU-based Hijri conversion (`hijriCalendar.ts`). `FRONTEND`
- [x] Calendar day-cell journal indicators — this session, extended from 3/8 to all 8 real Cycle journal categories (mood/notes/symptoms/activity/sleep/hydration/flow/intimacy) actually producing a visible dot; previously 5 categories were saved but invisible on the calendar. `FRONTEND` — **fixed this session**
- [x] "Today" cell visual priority — this session, fixed across **all 5** calendar implementations (Cycle/Conceive/Miscarriage/Postpartum/Pregnancy) so Today never gets a period/fertile/ovulation/selected solid-color background, keeping journal dots legible; selection no longer whitens dots/text on Today. `FRONTEND` — **fixed this session**

## 1.4 Daily Journal (generic/Cycle)

- [x] Physical symptoms (douleurs, migraines, ballonnements, acné, seins sensibles, fatigue) — `JournalSymptomsScreen.tsx`, real multi-select + notes, persisted via `dailyJournalStore.ts`. `FRONTEND`
- [x] Emotional (humeur, stress, énergie, irritabilité) — `JournalMoodScreen.tsx`, real sliders/selection. `FRONTEND`
- [x] Intime (libido, rapports, symptômes associés) — `JournalIntimacyScreen.tsx`/`JournalConceptionReportsScreen.tsx` (Cycle "Vie intime" and TTC "Rapports" — confirmed to share the exact same `DailyJournalEntry.intimacy` section) are gated by the existing PIN/Face ID (`PrivateIntimacyUnlockScreen`/`PrivateIntimacyPinScreen`/`PrivateIntimacyFaceIdScreen`), matching the spec's "champ discret, masquable" requirement, **and the underlying data is now AES-256-GCM-encrypted at rest** — see §2.14 for the encryption details. `FRONTEND` `PRIVACY` `SECURITY`
- [x] Lifestyle (sommeil, activité physique) — `JournalSleepScreen.tsx`, `JournalActivityScreen.tsx`. `FRONTEND`
- [x] Personal notes — `JournalNoteScreen.tsx`. `FRONTEND`
- [x] Multiple private photos (acné, pilosité, symptômes cutanés evolution) — **frontend/local gallery implemented, up to 5 photos/day.** `JournalPrivatePhotosScreen.tsx` supports choosing from the gallery or camera (`react-native-image-picker`, same call shape already used for the profile avatar), a responsive grid preview, replace/remove per photo, and save. Data model: `DailyJournalEntry.privatePhotos?: Array<{id, uri, addedAt}>` (stable per-photo ids, no uuid dependency — same timestamp+random idiom already used elsewhere in this codebase), written via the existing merge-safe `saveJournalSection`/`deleteJournalSection` — `dailyJournalStore.ts` itself needed zero changes. The pre-existing single-photo field (`privatePhoto?: {uri, addedAt}`) is kept read-only for backward compatibility via `resolvePrivatePhotos()` (`types/journal.ts`) — a legacy entry is transparently read as a 1-item array and only converted to the new shape the next time that specific day is saved; no global/destructive migration, no photo lost for days never revisited. Gated behind the existing "Vie intime" PIN/Face ID (`target: 'photos'`, same store as Rapports/Intimacy — no new PIN system). Each photo's URI failure is tracked independently — one unavailable photo degrades to an honest "Photo indisponible" placeholder without hiding the other photos, never a crash. `JournalNoteScreen.tsx`'s status card shows a count only ("3 photos ajoutées"), never a thumbnail. `FRONTEND` `PRIVACY`
- [x] Durable app-owned local photo-file storage — **implemented.** `src/services/privatePhotoStorage.ts` (new, using the newly-approved `@dr.pogodin/react-native-fs@2.40.0` dependency) copies each picked/legacy image into AWA's app-private, non-cache directory (`RNFS.DocumentDirectoryPath/journal-private-photos/<date>/<photoId>.<ext>`) at the moment "Enregistrer" is pressed — never into the public Gallery/Downloads/shared storage, never at pick time (so cancelling never creates an orphan file). Ownership is a pure app-private-path-prefix check (`isAppOwnedPrivatePhotoUri`), used both to know what still needs migrating and to guarantee only AWA's own files can ever be deleted — the original Gallery/Photo-Picker source file is never touched. Replacing a photo copies the new file, saves the journal metadata, then deletes the old AWA-owned file only after that save succeeds; removing a photo works the same way in reverse. A legacy/raw picker URI (from before this existed) is migrated the first time that specific day is opened and saved — no global boot-time scan. One photo's copy failure never blocks or corrupts the other up-to-4 photos in the same save. Uninstalling AWA or clearing its app data removes these files, as expected for local-only storage. `FRONTEND`
- [x] Encryption at rest — **implemented.** `src/services/privatePhotoEncryption.ts` (new) encrypts each photo's file contents with AES-256-GCM (same `@noble/ciphers` primitive as §2.14's intimacy encryption; `[version][12-byte nonce][ciphertext+tag]` written directly as base64, not the hex-in-JSON envelope, to avoid ~2x bloat on multi-megabyte files). The AES key is a **separate**, purpose-specific random 256-bit Keychain key (`com.hawa.private.photos.encryption-key`, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`) — deliberately never shared with the intimacy key, via a small shared lifecycle helper (`src/services/secureAesKeyStore.ts`) that keeps the two keys independent. `privatePhotoStorage.ts`'s `copyPrivatePhotoToAppStorage()` now encrypts on write, naming new/re-migrated files `<photoId>-<generation>.<ext>.awaenc` (a fresh timestamp+random generation token on every write — fixed a real data-loss bug where replacing a photo with another of the same extension could compute the exact same destination path as the file being replaced, silently overwriting it *before* the journal commit; the generation token guarantees a replacement/re-migration write can never collide with the currently-persisted file's path); a legacy plaintext app-owned file is transparently re-encrypted the next time that day is saved (same lazy, non-destructive, per-day migration pattern already used for the raw-URI-to-app-storage step) — no global scan, old file only deleted after the new encrypted write and journal save both succeed. Display decrypts to an in-memory `data:` URI (`readPrivatePhotoAsDataUri()`) — no plaintext temporary file is ever written to disk; decryption failure degrades that one photo to the existing "Photo indisponible" placeholder without affecting the others. `SECURITY` `PRIVACY` `MEDICAL`
- [ ] Backend/cloud storage, multi-device synchronization — not implemented, not started; this feature works fully offline and has no server component. `BACKEND`
- [x] Persistence, edit, delete — `saveJournalSection()`/`deleteJournalSection()` in `dailyJournalStore.ts`, confirmed merge-not-overwrite semantics (saving one section never destroys another). `FRONTEND`
- [x] Date selection — all entry screens use the consistent local `toLocaleDateString('en-CA')` key. `FRONTEND`
- [x] Calendar integration — see §1.3 (fixed this session for full 8-category coverage). `FRONTEND`
- [x] Statistics integration — Cycle's generic `StatisticsScreen.tsx` reads real symptom/mood/flow data (see §1.17 caveat on the 3/6/12-month range specifically). `FRONTEND`

## 1.5 Trying to Conceive (TTC)

- [x] Fertile window, ovulation — shared `cycleMath.ts`, same computation as Cycle. `FRONTEND`
- [x] Basal temperature — `JournalTemperatureScreen.tsx`, real entry + calendar + statistics integration. `FRONTEND`
- [x] Cervical mucus — `JournalCervicalMucusScreen.tsx`, same. `FRONTEND`
- [x] LH ovulation tests — `JournalLHTestScreen.tsx`, positive/negative/invalid, calendar "LH+" marker only for positive (by design), statistics count consistent. `FRONTEND`
- [x] Intercourse/reports — `JournalConceptionReportsScreen.tsx`, presence-only calendar marker, privacy-respecting (never exposes protection/libido detail). `FRONTEND` `PRIVACY`
- [x] Cycle evolution — `JournalCycleEvolutionScreen.tsx` (current cycle, real cycleMath, no journal coupling) + dedicated dashboard card + `ConceiveStatisticsScreen.tsx`'s Cycle tab (real historical average/shortest/longest from `periodHistory`, correctly excluding the current unfinished cycle, honest "Pas encore de données" empty state). Verified end-to-end this session. `FRONTEND` — **audited & one bug fixed this session** (Temperature-tab count inconsistency)
- [x] TTC Daily Journal exactly aligned to the 5 required categories (Température/Glaire/LH/Rapports/Évolution — the last one deliberately NOT a manual entry) — fixed this session (previously mixed in unrelated Cycle categories). `FRONTEND`
- [x] TTC Calendar Legend/Filters reflecting only real TTC categories — fixed this session. `FRONTEND`
- [x] TTC Statistics (Résumé/Température/Fertilité/Cycle tabs) — real data, cross-tab consistency verified and one count bug fixed this session. No 3/6/12-month selector (same "last up to 10 real entries" convention as Miscarriage — a deliberate, documented, non-buggy simplification). `FRONTEND`

## 1.6 Contraception

- [x] Pill / ring / patch / other hormonal treatment tracking — method-aware end-to-end as of this session. Onboarding (`ContraceptionMethodScreen.tsx` → `ContraceptionInformationScreen.tsx` → `ContraceptionRemindersScreen.tsx`) collects a real method + start date via `contraceptionPreferences.ts`. Pill/other are tracked as a single daily taken/late/missed status (`contraceptionIntakeHistoryStore.ts`); ring/patch are tracked as discrete, possibly-multiple-per-day insertion/removal/replacement / application/removal/replacement events (`contraceptionEventStore.ts`, a separate append-only store — never forced into the pill-shaped model). The Daily Journal, Dashboard "Suivi du jour", Calendar (markers/filters/legend), Statistics, and the "Voir tout l'historique" management screen are all now method-aware and read/write the correct store for the active method. `FRONTEND`
- [x] Configurable reminders / daily notifications — a real `reminderTime` (HH:mm) is now collected (`ContraceptionRemindersScreen.tsx`, `@react-native-community/datetimepicker`) alongside the existing generic ON/OFF preference, and a real local notification is scheduled via the shared `pregnancyNotifications.ts` chokepoint (`contraceptionReminderScheduling.ts`, wired in `App.tsx` the same way as TTC/Nifas). No pack/replacement cadence is scheduled — a single daily reminder only, by design (no such schedule is collected). **Known pre-existing gap, not introduced here**: `pregnancyNotifications.ts`'s permission-request promise is memoized app-wide forever, so a user who denied notification permission via any other reminder flow will not be re-prompted for Contraception reminders until app restart. `FRONTEND`
- [x] Missed-dose / delay / event tracking — pill/other: "Effectuée"/"En retard"/"Oubliée" (`taken`/`late`/`missed`, `late` added this session as a genuinely distinct status, never reinterpreting historical `missed` records). Ring/patch: real insertion/removal/replacement events, never a fabricated "next replacement due" date. The "Voir tout l'historique" screen now supports method-aware filters, and safe date-aware correction (pill/other: change a past day's status) and deletion (both) with confirmation — implemented as a self-contained action sheet in `ContraceptionDashboard.tsx` that operates on the record's own real date, deliberately NOT by reusing `ContraceptionJournalEntryScreen.tsx` (which is hardcoded to today's date by design). No medical guidance after a missed dose (intentionally out of scope — tracking only). `FRONTEND`
- [x] Contraception Dashboard/Calendar/Statistics — all three are now dedicated, real, and method-aware (previously this line was stale — see the corrected §1.2 entry above). Statistics' "Régularité" label was kept (a prior product decision) with an added one-line disclaimer ("Basé sur tes propres enregistrements.") rather than renamed; ring/patch show real per-event-type counts only, never a fabricated adherence percentage. `FRONTEND`
- [x] Method-switch start-date integrity — switching method in edit mode (`ContraceptionMethodScreen.tsx`) now clears the stale `methodStartDate`/`hasTreatmentBreak` from the previous method and forces re-entry via `ContraceptionInformationScreen.tsx` before returning, instead of silently keeping the old method's answers under the new method. Historical intake/event records for the previous method are never touched or deleted by a method switch. `FRONTEND`
- [x] **Resolved**: the hardcoded pill-only `PillPackProgressRing` ("Jour X/28", `PACK_TOTAL_DAYS = 28`) and the hardcoded "21 jours de pilule + 7 jours d'arrêt" schedule string are gone from `ContraceptionDashboard.tsx` and `ContraceptionCalendarContent.tsx`. A dedicated `PillScheduleScreen.tsx` (reached only for `method === 'pill'`, between `ContraceptionInformationScreen` and `ContraceptionRemindersScreen`, and re-editable later) now collects a real schedule and persists it via `contraceptionPreferences.ts`. Both files derive `pillScheduleTotalDays` (`activeDays + breakDays`, real values only) and pass it into `getPillPackDay`/`PillPackProgressRing` — `getPillPackDay`'s `totalDays` parameter no longer has a `28` default at all (verified: no caller depends on one). `FRONTEND`
- [x] **Resolved**: `contraceptionPreferences.ts` now has `pillScheduleType: 'continuous'|'cyclic'|'unknown'|null`, `activeDays: number|null`, `breakDays: number|null` (verified present in the type, `defaultPreferences`, and the hydration parsing with real type guards — round-trips correctly through a cold restart). `PillScheduleScreen.tsx` reuses the existing `hasTreatmentBreak` answer (never re-asks it) to branch: `hasTreatmentBreak === true` shows two real +/- stepper cards (Jours de prise / Jours d'arrêt) with a live-computed total and an explicit "Je ne connais pas encore mon schéma" opt-out (→ `'unknown'`, both day fields `null`); `hasTreatmentBreak === false` shows a no-counter "Prise continue" confirmation (→ `'continuous'`, no invented total). `FRONTEND`

## 1.7 SOPK / Irregular Cycles

- [x] Irregular-cycle-specific tracking (acné, pilosité, variations de poids, douleurs, humeur, fatigue, symptômes associés) — fully implemented across this session's SOPK work: dedicated `irregularJournalStore.ts` (`IrregularJournalEntry`: `acne`/`hairGrowth`/`weight`/`pain`/`mood`/`fatigue` as neutral scale/free-text strings, plus `symptoms: string[]` for the "Fatigue & symptômes" screen's multi-selected associated symptoms), deliberately isolated from `dailyJournalStore.ts` (objective isolation). "Règles" deliberately reuses the existing shared `dailyJournalStore.flow` (`MenstrualFlowScreen.tsx`) rather than a second, divergent period field — same canonical source every other objective's calendar/statistics already read. Every category is saved via `IrregularJournalEntryScreen.tsx`/`saveIrregularJournalField()`/`saveIrregularFatigueEntry()` (real upsert-in-place, no duplicate entries — verified by dedicated store tests) and read back live by the Dashboard ("Suivi du jour" tiles + real X/7 progress), Calendar (markers/legend/filters/selected-day detail), and Statistics (per-category distributions/monthly trends/associated-symptom frequency). `FRONTEND`
- [x] "Long cycle ≠ automatic late-period classification" — verified end-to-end this session across onboarding, Dashboard, Calendar, Statistics, Profile, and reminder notifications, specifically for the **SOPK-specific** model (not just the generic Cycle `window`/`observing` honesty this line previously credited): `IrregularDashboard.tsx`/`IrregularCalendarContent.tsx`/`IrregularStatisticsScreen.tsx`/`irregularDailyTrackingMath.ts` never call `computeCyclePredictionStatus()` (whose `window` mode carries Cycle's own `isLate`/"Règles en retard" wording); `computeIrregularCycleDay()` only ever returns a plain elapsed-day count with no "late" concept, and the reminder notification text ("Tu n'as pas encore renseigné de nouvelles règles. Pense à mettre ton suivi à jour si elles ont commencé.") is neutral, never "en retard". An exhaustive grep for `retard|isLate|overdue|expectedPeriod|nextPeriod|computeCyclePredictionStatus` across every SOPK-specific file confirms zero active occurrences (only comments documenting the rule). Explicit long-cycle regression tests exist (`irregularDailyTrackingMath.test.ts`: a 45-day gap still returns a plain `number`, never an `isLate` field). `FRONTEND`
- [x] SOPK-specific Dashboard/Calendar/Statistics/Journal — all four fully implemented this session (`IrregularDashboard.tsx`, `IrregularCalendarContent.tsx`, `IrregularStatisticsScreen.tsx`, `IrregularJournalEntryScreen.tsx` + `IrregularJournalOverviewScreen.tsx`), wired into the objective-aware routing triad + `JournalSheetHost` exactly like Contraception/Menopause (see §1.2). No longer falls through to generic Cycle screens. Reuses existing architecture throughout rather than duplicating it: `AnimatedProgressRing` (extracted from Contraception into a shared component, not copy-pasted), `QuickActionsGrid`, `SpiritualGuidanceCard`/`usePrayerPurityStatus`, `ObjectiveArticlesSection`, `PostpartumJournalScreenLayout`, `JournalSaveToast`, `usePremium()`/`HawaPremiumBottomSheet`, the shared Calendar visual language (dashed "Aujourd'hui" outline, Hijri day numbers, Ramadan/Dhoul Hijja markers), and the same 1-month-FREE/3-6-12-PREMIUM Statistics pattern every other objective uses. Calendar marker overflow (5+ real categories on the same day) is handled by a dedicated `computeVisibleDayMarkers()` compact "+N" badge — fixed this session; markers past the 4th were previously dropped from the day cell with no visual trace, though the selected-day card always showed the full real data. One real data-flow bug found and fixed this session: the Dashboard's cycle-day ring read the shared, SOPK-unreachable `onboardingPreferences.cyclePreferences`/`hasConfirmedCycleData` (only ever populated by the standard Cycle objective's own `CycleInformationScreen.tsx`/`PeriodStartBottomSheet.tsx`, neither reachable by a pure-SOPK user) and was therefore permanently stuck showing "Cycle à renseigner" even after onboarding and active journaling; it now reads SOPK's own `irregularPreferences.lastPeriodDate`. `FRONTEND`
- [x] SOPK Profile — `ProfileScreen.tsx` shows 4 SOPK-specific cards (Type de cycle / Durée des règles / Dernières règles / Date Hijri) sourced from `irregularPreferences.cyclePattern` and the most recently confirmed real occurrence in `confirmedPeriodHistoryStore.ts` — confirmed to never show "Cycle moyen"/"Prochaines règles"/"Règles en retard" for `objective === 'irregular'` (that branch is now explicitly excluded from the generic Cycle stats block). `FRONTEND`
- [x] SOPK Onboarding — full 4-question flow (`IrregularOnboardingScreens.tsx`: cycle pattern / last period date / tracked items / reminders), every answer genuinely persisted in `irregularPreferences.ts` and consumed downstream (verified field-by-field). Complete navigation path audited end-to-end this session (objective selection → confirmation → name → spiritual markers ON/OFF branch → [Location] → SOPK onboarding → SecuritySetup → Protection d'espace → Summary → Auth → SOPK Dashboard) — both spiritual-markers branches confirmed correct (a historical bug routing `irregular` through the wrong screen had already been fixed before this audit; re-confirmed still correct), and `SummaryScreen.tsx`'s `buildIrregularRows()` confirmed free of Cycle-specific predictions (no retard/fenêtre fertile/ovulation wording). `FRONTEND`
- [x] SOPK reminders synchronized with Profile — onboarding's `IrregularRemindersScreen` and Profile → Santé générale → Notifications & rappels (same screen, `{mode:'edit'}`) read/write the exact same `irregularPreferences.reminders` — one canonical source, no duplicate state (verified with a dedicated persistence test simulating an onboarding-set value later changed from Profile). `FRONTEND`
- [x] SOPK is at least represented in the Library with real, well-covered articles (`pcos`, `hormones`, `acne`, `weight`, `exercise` categories, 10 articles), plus a real, non-mock recommended-reading section on the Dashboard itself (`ObjectiveArticlesSection` + `getLibraryConfigForObjective('irregular')`, re-confirmed this session — not a placeholder). `FRONTEND`
- **Note:** verified this session by direct code audit, dedicated Jest tests (irregularJournalStore/irregularPreferences/irregularCalendarMath/irregularStatisticsMath/irregularDailyTrackingMath), `npx tsc --noEmit`, ESLint (`--max-warnings=0`), and a full `gradlew.bat assembleDebug` success. **Not yet real-device tested** — see the final implementation reports for the exact untested paths (Calendar marker overflow on a small screen, Dashboard ring after a real onboarding date entry, Profile↔onboarding reminder sync round-trip, keyboard behavior on the weight/journal screens). CSV/PDF medical export still reuses the generic Cycle categories for `irregular` (`objectiveExportConfig.ts`) — **intentionally left untouched**, since export was outside this audit's scope and the cahier des charges doesn't require a dedicated SOPK export model.

## 1.8 Perimenopause / Menopause

- [x] Onboarding — 4-screen flow (stage / symptoms to track / hormonal-treatment relevance / lab-tracking preference), persisted in `menopausePreferences.ts` (`stage`, `trackedSymptoms`, `hormonalTreatmentStatus`, `labTracking`), own AsyncStorage key, isolated from every other objective. `FRONTEND`
- [x] Symptom tracking (bouffées de chaleur / sueurs nocturnes / troubles du sommeil / fatigue / variations d'humeur / brouillard mental) — implemented this session via `menopauseJournalStore.ts` (date-keyed `symptoms: MenopauseSymptom[]`) + `MenopauseJournalEntryScreen.tsx`'s multi-select 'symptoms' category, with an optional non-diagnostic Léger/Modéré/Sévère perceived intensity. Surfaced in Dashboard "Suivi du jour", Calendar day markers, and Statistics frequency counts. `FRONTEND`
- [x] Mood / Sleep / Energy tracking — implemented this session as simple, non-diagnostic fields: mood reuses the project's existing shared `MoodLevel` taxonomy (never a second, incompatible mood system); sleep is duration (hours) + perceived quality (Bonne/Moyenne/Mauvaise); energy is a 3-level perceived scale (Faible/Moyenne/Élevée). Deliberately not the full Cycle mood-slider system (energy/stress/irritability/motivation) — out of scope for this objective's "keep it simple" requirement. `FRONTEND`
- [x] Hormonal-treatment tracking — implemented this session as a simple daily "Pris / Non pris" status plus an optional free-text tracking note (`treatmentStatus`/`treatmentNote`), shown only when the onboarding `hormonalTreatmentStatus === 'track'`. No dose, schedule, frequency, or recommendation is ever collected, displayed, or invented. `FRONTEND`
- [x] FSH / estradiol tracking — implemented this session as a separate append-only lab-results list (`addMenopauseLabResult`/`getMenopauseLabResults` in `menopauseJournalStore.ts`), gated by the onboarding `labTracking` preference (`fsh`/`estradiol`/`both`/`none`). Each result is `{type, value, unit?, date}` only — values are tracking data exclusively; never interpreted, never thresholded, never labeled normal/abnormal, no diagnosis inferred. `FRONTEND` `MEDICAL`
- [x] Menopause-specific Dashboard/Calendar/Statistics/Journal — implemented this session (`MenopauseDashboard.tsx`, `MenopauseCalendarContent.tsx`, `MenopauseStatisticsScreen.tsx`, `MenopauseJournalEntryScreen.tsx`), wired into the objective-aware routing triad + `JournalSheetHost` exactly like Contraception (see §1.2). No longer falls through to generic Cycle screens. Reuses existing architecture throughout: `PremiumChoiceCard`, `QuickActionsGrid` (personalization/reordering unchanged), `SpiritualGuidanceCard`/`usePrayerPurityStatus` (extended, not duplicated), `PostpartumJournalScreenLayout`/`ChoiceChips`/`LabeledInput`, `JournalSaveToast`. `FRONTEND`
- [x] Represented in Library — an onboarding picker option + a curated library reading list (`menopause`, `hotFlashes`, `bones`, `treatments` categories, 4 articles), unchanged from before. `FRONTEND`
- **Note update:** no longer "product-scope-in-name-only" — core tracking (symptoms/mood/sleep/energy/hormonal-treatment/FSH/estradiol) and all 4 dedicated screens now exist end-to-end, verified by code inspection, `npx tsc --noEmit`, and ESLint (`--max-warnings=0`) only. **Not yet real-device tested** — see the final implementation report for the exact untested paths (calendar markers on a real device, journal save → Dashboard/Calendar/Statistics live refresh, restart persistence).

## 1.9 Pregnancy

- [x] Estimated due date, weekly progression — `pregnancyPreferences.ts` (`getPregnancyDating`), `computePregnancyStatus()` in `pregnancyTrackingUtils.ts`. `FRONTEND`
- [x] Dashboard, Calendar, Statistics, Daily Journal — all four dedicated and functional (`PregnancyDashboard.tsx`, `PregnancyCalendarContent.tsx`, `PregnancyStatisticsScreen.tsx`, `pregnancyJournalStore.ts` + shared `dailyJournalStore` for mood/sleep). `FRONTEND`
- [x] Appointments / important exams / reminders — `pregnancyMedicalEventsStore.ts`, real calendar markers (colored dots per event type), real reminder scheduling. `FRONTEND`
- [x] Symptoms, weight, mood, sleep, personal medical info — all real, `pregnancyJournalStore.ts` + shared journal store. `FRONTEND`
- [x] Calendar day-grid markers for journal categories (symptoms/weight/mood/sleep/medical info), not just medical events — **fixed this session** (previously these 5 categories were saved and shown in the day-detail card, but produced no month-grid dot at all). `FRONTEND` — **fixed this session**
- [x] Notification system — centralized, privacy-redacting chokepoint (`pregnancyNotifications.ts::scheduleLocalNotification()`), confirmed by two independent audits this session (calendar-sync audit and this security audit) to correctly respect discreet-notification settings app-wide. `FRONTEND`
- [x] `medicalInformation` is a single record for the whole store (not one per date) by design — means only one date at a time can show as "medical info recorded" on Calendar/Dashboard. Confirm this is the intended UX, not an oversight. `FRONTEND`

## 1.10 Postpartum

- [x] Lochia (start/duration/flow/evolution/symptoms/end tracking) — `postpartumLochiaStore.ts`, dedicated screen, distinct calendar color, real "end tracking" logic. `FRONTEND`
- [x] Cycle return (first postpartum period, hormonal evolution, breastfeeding, amenorrhea) — audited to full depth and confirmed complete. `PostpartumCycleReturnScreen.tsx` records the real first postpartum period date (`recordFirstPostpartumPeriod()`, canonical `postpartumPreferences.ts`, never inferred from lochia) with real consistency checks against delivery date and lochia end date; hormonal evolution and the post-partum timeline are explicitly educational with honest disclaimers ("ne mesurent pas tes hormones et ne constituent pas un diagnostic"); amenorrhea is correctly derived from the real recorded date, never a separate fabricated field; feeding type is real, persisted, canonical (`postpartumPreferences.feedingType`/`setFeedingType()`), consumed by Dashboard/Calendar/Profile, and — fixed this session — now editable after onboarding via the "Allaitement" row on this same screen (`PostpartumFeedingScreen.tsx` reused as-is with an `{mode: 'edit'}` param, no second screen/store/field). Nifas (religious) and lochia (medical bleeding) remain correctly unconflated with cycle return. `firstPostpartumPeriodDate` is deliberately isolated from Cycle's own `periodHistory` (per-objective store isolation, consistent with the rest of the app) — not connected in this task. `FRONTEND`
- [x] Daily tracking (fatigue/sommeil/humeur/douleurs/récupération) — `postpartumJournalStore.ts`, 5 real categories, `useFocusEffect`+pub/sub sync confirmed. `FRONTEND`
- [x] Dashboard, Calendar, Statistics, Journal — all four dedicated and functional, confirmed via this session's calendar-sync audit. `FRONTEND`
- [x] Nifas prayer-resumption feature (see §1.11 for full detail) — functional. `FRONTEND` `RELIGIOUS-CONTENT`

## 1.11 Nifas

- [x] Duration tracking after delivery — `hasReligiousNifasEnded()` in `postpartumTrackingUtils.ts`, day-count check independent of medical lochia tracking (by design, so lochia can continue past the religious threshold without blocking the prayer-resumption message). `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Educational threshold reminder (J35 warning + J40 completion) — real, scheduled local notifications (`postpartumNifasReminderScheduling.ts`), plus an in-app completion popup on `PostpartumDashboard.tsx` with acknowledgement persistence. `FRONTEND`
- [x] Handling persistent bleeding — explicitly handled: the completion popup instructs prayer resumption "même si les lochies ou les saignements persistent," and the code comments confirm this is intentional (religious threshold ≠ medical bleeding end). `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Neutral presentation of jurisprudential divergence — **implemented / code-verified this session**: the completion popup/notification copy no longer states "Les 40 jours de nifâs sont terminés"/"Reprends tes prières, même si les lochies persistent" as settled fact. Reworded to "Le repère des 40 jours retenu par AWA est atteint" / "Selon ce repère, tu peux reprendre tes prières même si des saignements persistent" (`postpartumNifasReminderScheduling.ts`'s `internalContent`/`notificationTitle`/`notificationBody`, plus the matching Dashboard popup in `PostpartumDashboard.tsx`), reusing the same "repère/référence retenu(e)" vocabulary already validated in `NifasFiqhArticleScreen.tsx`. `NIFAS_REFERENCE_CONFIG_VERSION` bumped (2→3) so already-scheduled reminders pick up the new wording. J35/J40 scheduling logic itself is unchanged. Not device-verified — code/TypeScript/ESLint/Android-build verified only. `FRONTEND` `RELIGIOUS-CONTENT` `!` RELIGIOUS-CONTENT VALIDATION REQUIRED (wording still needs scholar sign-off, per project convention)
- [~] Threshold configurability — `NIFAS_REFERENCE_DAYS = 40` is a hardcoded constant in one config file (`nifasReminderConfig.ts`), easy to change centrally, but not user/madhhab-configurable in-app. Acceptable for now if the single reference is scholar-approved; flag if a per-school configurable threshold is later required. `FRONTEND` `!` RELIGIOUS-CONTENT VALIDATION REQUIRED
- [x] Duplicate-notification prevention, acknowledgement state — confirmed this session (config-version bump forces reschedule of stale copy; single acknowledgement flag). `FRONTEND`
- [x] Notification privacy — routes through the same centralized redaction chokepoint as all other notifications. `FRONTEND` `PRIVACY`
- [x] Educational article exists (`NifasFiqhArticleScreen.tsx`), neutral tone, real content. `FRONTEND` `RELIGIOUS-CONTENT` `!` RELIGIOUS-CONTENT VALIDATION REQUIRED (see §1.18)

## 1.12 Miscarriage (Après une fausse couche)

- [x] Bleeding, physical symptoms — `miscarriageJournalStore.ts`, real fields, real screens. `FRONTEND`
- [x] Cycle return tracking — `MiscarriageCycleReturnScreen.tsx` (per onboarding flow), real store fields. `FRONTEND`
- [x] Personal notes — real, private-content-appropriate (presence-only where relevant). `FRONTEND`
- [x] Restarting conception journey ("trying again" status) — `miscarriageTryingAgainDisplay.ts`, real status field. `FRONTEND`
- [x] Dashboard, Calendar, Journal, Statistics — all four dedicated, confirmed this session as a **reference-quality implementation** (best-synchronized of all objectives: `useFocusEffect` + pub/sub subscription combo). `FRONTEND`
- [x] "Transition between objectives" (e.g., resuming TTC) — `MiscarriageDashboard.tsx` now shows an explicit, dismissible "Reprendre ton projet de conception" CTA when `tryingAgainStatus === 'ready'` (hidden for `not_now`/`soon`/unset); on confirmation it calls the same canonical `setSelectedObjective('conceive')` Profile's "Mon objectif" switcher already uses — no second objective-switch mechanism, no auto-switch from the stored preference alone. Verified: Miscarriage and Conceive data both survive the switch in either direction, and Home/Calendar/Statistics react immediately via the existing `subscribeActiveObjective` pub/sub. `FRONTEND`

## 1.13 Spiritual Markers

- [x] Optional activation, editable later in Settings — confirmed real and consistently gating (11 files check the flag), toggle in `ProfileScreen.tsx` + `SpiritualPreferencesScreen.tsx` at onboarding. `FRONTEND`
- [x] Prayer times — real, functional, Aladhan API + real location permission flow. Location is now also editable in-place from `PrayerTimesScreen.tsx`'s "Modifier" pill (`navigate('Location', {mode: 'edit'})`) without re-entering onboarding — fixed a real bug where saving a location edit dragged the user back through the onboarding funnel; works identically for all 8 objectives via the one shared `LocationScreen.tsx`/`PrayerTimesScreen.tsx`, no per-objective duplication, no new store. `FRONTEND`
- [x] Purity indicator / prayer resumption — fully correct, matches spec precisely (see §1.14). `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Hijri calendar — broadly integrated app-wide. `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Ramadan / Dhul Hijjah highlighting — **implemented in the day-by-day calendars of all 8 objectives.** Reuses the exact canonical `isRamadan()`/`isDhoulHijja()` per-date helpers from `hijriCalendar.ts` (no new Hijri conversion logic) to mark each individual day cell — not just the month-level treatment `HijriCalendarScreen.tsx` already had — with a small corner crescent-moon icon, visually distinguishable (Ramadan: existing purple spiritual accent; Dhou al-Hijja: existing warm gold accent from the same screen's Ramadan pill), independent of the journal-dot row and the background-fill priority system (today/selected/period/fertile/ovulation/pregnancy-milestone markers all preserved). Visible regardless of calendar display mode (Gregorian/Hijri/Double) and gated entirely by the existing `spiritualMarkersEnabled` preference (marker, inline legend entries, and full Légende-sheet entries all disappear together when disabled) — no new Calendar filter toggle. Covers Cycle, Contraception, SOPK/irregular, Menopause (shared `MonthCalendarCard.tsx`), Conceive, Postpartum, Loss/Miscarriage, and — confirmed complete and Guardian-validated this session — Pregnancy's separate `PregnancyCalendarContent.tsx`, each of the 4 independent implementations updated individually since they don't share a component. **Genuine 8/8 objective coverage.** `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Fasting/Qadaa — fully functional (see §1.15). `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Nifas — functional (see §1.11). `FRONTEND` `RELIGIOUS-CONTENT`
- [~] Religious educational content — present, disclaimed, neutral tone, but **unvalidated** (see §1.18). `FRONTEND` `RELIGIOUS-CONTENT` `!` RELIGIOUS-CONTENT VALIDATION REQUIRED

## 1.14 Prayer & Purity

- [x] Menstruation state / purity state — `purityPrayerLogic.ts` + `usePrayerPurityStatus.ts`, correctly cycle-objective-gated only. `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Exact period-end time input — real UI ("Renseigner" CTA when unset). `FRONTEND`
- [x] Current-prayer-window / due-after-purity calculation — correctly implements the exact spec rule (only flags a prayer due if purity returns inside that prayer's still-open window). `FRONTEND` `RELIGIOUS-CONTENT`
- [x] No missed-prayer counter for menstruation period — confirmed absent by exhaustive grep; multiple in-app text strings actively state this dispensation is permanent, matching spec exactly. `FRONTEND` `RELIGIOUS-CONTENT`
- [x] UI notification / educational explanation — `PurityStatusCard.tsx`, `CycleHomeScreen`'s `SpiritualGuidanceCard` summary. `FRONTEND`

## 1.15 Fasting / Qadaa

- [x] Ramadan detection — real, derived from the same ICU Hijri conversion (`isRamadan()` in `hijriCalendar.ts`), not a hardcoded date table. `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Missed fasting days / qadaa counter — `computeQadaaFromHistory()`, walks **confirmed** period history (deliberately not live/predictive prefs, to avoid retroactive corruption). `FRONTEND`
- [x] Editing / marking as caught up — `markOneQadaaDayCompleted()`, real, wired to a UI button. `FRONTEND`
- [x] History — `qadaaHistoryPresentation.ts`, real per-occurrence display. `FRONTEND`
- [x] Reminder after Ramadan ends — **two complementary pieces, both real:** the existing in-screen reactive card (`shouldShowQadaaReminder()` in `FastingQadaaScreen.tsx`, unchanged) plus, new this session, a real **LOCAL** scheduled Android notification (`src/utils/qadaaReminderScheduling.ts` + `src/state/qadaaReminderNotificationStore.ts`, wired in `App.tsx`) so the reminder can appear while AWA is closed — **no backend/server push required**, reuses the existing `@notifee/react-native`-based chokepoint (`pregnancyNotifications.ts`) and the same canonical `isRamadan`/`hijriMonthStart`/`nextHijriMonthStart` helpers the in-app card's own logic is built on (no second Ramadan-end calculation). Gated by `spiritualMarkersEnabled`; idempotent across app restarts (persisted per-Ramadan schedule key); permission-denial-safe (no crash, no fake success, in-app card unaffected). **Known, deliberately out-of-approved-scope gap:** unlike Nifas, tapping this notification does not deep-link to `FastingQadaaScreen` and it is not recorded in the in-app notification-center history — flagged by Guardian review, not part of this task's approved file list, left as a follow-up decision. `FRONTEND`
- [x] Spiritual markers integration — correctly gated. `FRONTEND`
- [x] Cosmetic: the stray dev comment (`// Claude must add this to useQadaaStatus:`) in `FastingQadaaScreen.tsx` has been removed — cleanup only, no behavior change. `FRONTEND`

## 1.16 Hijri Calendar

- [x] Gregorian + Hijri display, double-calendar mode — broadly implemented app-wide (11+ consuming files). `FRONTEND`
- [~] Date accuracy — uses ICU's tabular "civil" Islamic calendar algorithm (via `Intl.DateTimeFormat`), a legitimate and consistent approach, but **not** moon-sighting-based and can differ by a day from locally-announced dates. **Improved this session:** a user-adjustable ±1-day alignment (`onboardingPreferences.ts`'s `hijriAdjustmentDays`, default 0, zero behavior change for existing users) is now applied in exactly one canonical place (`hijriCalendar.ts`'s `hijriPartsFor()` and `cycleMath.ts`'s Hijri formatters) so the adjustment, Ramadan/Dhoul Hijja classification, Qadaa, the post-Ramadan reminder, and every displayed Hijri date across all 8 objective calendars can never disagree with each other — verified via boundary regression tests and a full repo audit (exactly one raw ICU call site, no remaining screen bypasses it, including the two pre-existing duplicates fixed this session: `ProfileScreen.tsx`'s standalone `formatHijriDate` copy, and 6 dashboards that previously preferred the Aladhan Prayer Times API's own `hijriDate` string). A "Calendrier Hijri" settings section (`PrayerTimesScreen.tsx`) shows the region from the existing Prayer Times location as context only (explicitly disclaimed as not an automatic official-announcement lookup) plus the adjustment control, with a neutral disclaimer and no "official"/"synchronisé avec les autorités" claim. **Aladhan's own dedicated Islamic Calendar API was investigated this session (live endpoint testing) and confirmed NOT to provide genuine per-country official/moon-sighting coverage for AWA's target regions (Algeria/Morocco/Tunisia) — only Saudi Arabia (HJCoSA) and Turkey (DIYANET) have a real official source in that API, neither relevant to AWA's audience — so it was deliberately not integrated.** Automatic official/local moon-sighting announcements for AWA's actual target regions remain unavailable pending a genuinely trusted, region-specific data source. `FRONTEND` `RELIGIOUS-CONTENT`
- [x] Ramadan / Dhul Hijjah calendar integration — present both at month-level on the dedicated Hijri screen and, since this session, at the individual day-cell level across all 8 objective calendars (duplicate of the §1.13 note — tracked once here as the canonical item). `FRONTEND` `RELIGIOUS-CONTENT`

## 1.17 Statistics

- [x] Base statistics (average cycle duration, flow evolution, symptom frequency) — real, computed from actual journal/period data, across Cycle/Conceive/Pregnancy/Postpartum/Miscarriage. `FRONTEND`
- [~] **3/6/12-month trend selector** — exists as a UI control in **exactly one** screen (`StatisticsScreen.tsx`, the generic Cycle statistics), but is explicitly wired to **hardcoded mock data** (`PREVIEW_DATA`, with an in-code comment: "Replace this later with data calculated from your real cycle/journal stores"). No other Statistics screen (Pregnancy/Postpartum/Conceive/Miscarriage) has this control at all. **The spec's headline "tendances sur 3, 6 et 12 mois" feature is functionally not implemented anywhere in the app today**, despite one screen having the selector chrome. `FRONTEND` `PREMIUM`
- [x] Conceive/Miscarriage "last up to 10 real entries" trend approach — a real, working, honestly-scoped alternative to month-range trends; not a bug, a documented simplification. `FRONTEND`
- [x] Premium gating of advanced statistics — **implemented this session for the one screen the paywall actually markets**: `StatisticsScreen.tsx`'s 3/6/12-month view (still on mock `PREVIEW_DATA` — the gate itself doesn't change that pre-existing gap) now shows a `PremiumLockedCard` instead of the range/charts when `!isPremium`. The other 6 objectives' Statistics screens are real/live but structurally different (tabs, day-ranges, or shorter month-ranges) and were deliberately left free pending an explicit product decision — see §1.22. `FRONTEND` `PREMIUM`

## 1.18 Library & Educational Content

- [x] Article library — **72 real, non-placeholder French articles** (re-counted and verified by a full read-only audit this session — the previous "~114" figure was incorrect) covering **every** spec topic (premières règles, cycle, fertilité, contraception, grossesse, post-partum, fausse couche, SOPK, périménopause/ménopause, and the full "Cycle et pratique religieuse" set: fiqh féminin, istihâda, jeûne/qadaa, nifas-fiqh, prière, FAQ). `FRONTEND`
- [x] Categories, article reader — real filtering, real navigation, **69 bespoke hand-designed article screens + 3 articles intentionally using the generic fallback reader** (`basaltemp-suivre-temperature`, `cervicalmucus-observer-glaire`, `lhtests-comprendre-tests-ovulation` — functional and reachable, not broken or orphaned, simply not yet given bespoke visual treatment), bookmarking, scroll-position persistence. `FRONTEND`
- [x] Search — real, functional (query + category + tab combined filtering, empty-state reset). `FRONTEND`
- [x] Tone/iconography — genuinely modest phrasing, no Western stock-photo iconography (icon-only, no imagery in the content layer). `FRONTEND`
- [~] Religious content validation — `RELIGIOUS_DISCLAIMER` constant is real and shown on every religious article/screen ("contenu purement éducatif... ne délivre pas de fatwas"), and the tone is neutral across schools where it addresses divergence. **However, there is no `validated`/`reviewStatus` field in the article data model** — every religious article ships with the same generic disclaimer regardless of whether a scholar has actually reviewed it. `FRONTEND` `RELIGIOUS-CONTENT` `!` RELIGIOUS-CONTENT VALIDATION REQUIRED — **all fiqh/istihâda/nifas-fiqh articles should be treated as unreviewed drafts until sign-off, and this should be tracked in the data model, not just assumed.**
- [ ] Free vs. Premium article gating — **not implemented**; mentioned only as a marketing bullet in the Premium paywall sheet ("Guides approfondis... contenus éducatifs exclusifs"), zero enforcement in `LibraryScreen.tsx`/`ArticleReaderScreen.tsx`/`libraryStore.ts`. `FRONTEND` `PREMIUM`
- [x] Category article-count badges — **fixed**: counts are now dynamically computed from `LIBRARY_ARTICLES` via `countArticlesForCategoryIds()` in `LibraryScreen.tsx`, so the displayed number can never drift from the real per-category article count again. `FRONTEND`
- [x] Per-objective curated recommendations (`getLibraryConfigForObjective`) — fully implemented for **all 8** objectives including Contraception/SOPK/Menopause (this is their only genuinely-differentiated treatment anywhere in the app today). `FRONTEND`

## 1.19 Privacy / Mode Pudeur

- [x] Discreet app icon/name — fully implemented and real-device verified on Android. AWA can switch between its normal launcher identity and the discreet "Agenda" identity using Android activity-alias components (`LauncherAwa` / `LauncherDiscreet` in `AndroidManifest.xml`) targeting the same `.MainActivity`/package, preserving the same application data — package identity and deep links are unaffected. Runtime switching uses `PackageManager#setComponentEnabledSetting` (`DiscreetLauncherModule.kt` + `DiscreetLauncherPackage.kt`, exposed to JS via `discreetLauncher.ts`) with safe target-enable-before-previous-disable sequencing, so a failure mid-switch can never leave both aliases disabled. New `DiscreetLauncherScreen.tsx`, reached from "Apparence discrète" in `PrivacySecurityScreen.tsx`, lets the user pick "Identité AWA" or "Identité discrète" (name "Agenda", a neutral vector-drawable calendar icon with no AWA/health/religious symbolism) via the shared `PremiumChoiceCard`. A Huawei/EMUI false negative was found and fixed during real-device testing: the native existence check resolved launcher-alias components with `getActivityInfo(component, 0)`, which on that device fails to resolve a component whose manifest-declared `android:enabled="false"` (the inactive alias, by design) — incorrectly reporting `DISCREET_LAUNCHER_COMPONENT_NOT_FOUND` even though `dumpsys package` confirmed both aliases existed. Fixed by resolving with `PackageManager.MATCH_DISABLED_COMPONENTS`, so a disabled-but-existing alias is now correctly distinguished from a genuinely missing one. AWA → Agenda → AWA switching was successfully tested end-to-end on a real Huawei/EMUI device, including the discreet identity persisting correctly across a full device restart. This feature only changes the launcher-facing icon/name — it does not encrypt data, does not provide authentication, does not hide the app package, and has not been tested on every Android manufacturer. `FRONTEND` `ANDROID`
- [x] App-wide PIN/biometric lock, independent of phone unlock — **cold-start bypass fixed.** Root cause confirmed by direct code audit: `App.tsx` unconditionally called `setAppLockState('unlocked')` once security preferences hydrated, never consulting `requiresAppLock()`. Fixed to `setAppLockState(requiresAppLock() ? 'locked' : 'unlocked')`. (Side note from this audit: `SplashScreen.tsx` already had its own separate, 5-second-delayed `lockApp()` call that partially masked the practical impact — but that was incidental, not a designed control, and is unaffected by this fix.) Architecture itself (`appLockStore.ts` + `AppLockScreen.tsx` + `appSecurityService.ts`, Keychain-backed) is unchanged and was not rebuilt. `FRONTEND` `SECURITY` `PRIVACY`
- [x] Private-section-only PIN/Face ID (for "Vie intime"/"Rapports"/"Photos privées") — separate, correctly working, salted-hash + Keychain-backed (`privateSectionAuthStore.ts`, `privateSectionAuth.ts`). Extended this session with a third `target: 'photos'` value (`PrivateIntimacyUnlockScreen.tsx`/`PrivateIntimacyPinScreen.tsx`/`PrivateIntimacyFaceIdScreen.tsx`) — same store, same PIN, no new authentication system. `FRONTEND` `SECURITY` `PRIVACY`
- [x] Discreet notifications (hide content preview) — fully implemented, centralized, toggles in `PrivacySecurityScreen.tsx`. `FRONTEND` `PRIVACY`
- [~] Real encryption of sensitive data on-device — **partial, improved further this session.** PIN/biometric secrets are correctly kept in the OS Keychain. "Vie intime"/"Rapports" (`intimacy`), private-photo file contents, and now **generic "Notes personnelles"** (`dailyJournalStore.ts`'s `note` field — the exact field this TODO previously named as the top-priority remaining gap) are all AES-256-GCM-encrypted at rest, each with its own dedicated, non-shared Keychain key (`privateJournalEncryption.ts`, `privatePhotoEncryption.ts`, new `privateNotesEncryption.ts`). Legacy plaintext notes are migrated automatically and safely on app boot (`migrateLegacyPlainNotes()` in `App.tsx`) — idempotent, and a mid-migration crash cannot lose data (plaintext is only deleted after the encrypted write is confirmed persisted). **Still plaintext, requiring an explicit product decision before encrypting** (full audit done this session, not silently expanded into): Miscarriage's `personalNotes`, Contraception's journal `notes`, Pregnancy's `medicalInformation.note`, and General Health's `medicalNotes` (all High sensitivity); plus Medium-sensitivity symptom/mood/lochia notes across Postpartum/Pregnancy/Miscarriage journals and confirmed-period-history dates. `android:allowBackup="false"` confirmed still in place — reduces cloud/ADB extraction paths but is explicitly NOT a substitute for encryption. `FRONTEND` `BACKEND` `SECURITY` `PRIVACY` — **intimacy + photo + generic-notes encryption done; other objective-specific notes/symptom fields remain, pending a scope decision**
- [x] Private photo encryption — feature exists frontend/locally (§1.4) and photo file contents are now AES-256-GCM-encrypted at rest — see §2.15 for the full design. `SECURITY` `PRIVACY`

## 1.20 Notifications

- [x] Pregnancy, Postpartum/Nifas, journal reminders — all real, scheduled via `@notifee/react-native` (local-only, confirmed no remote push anywhere). `FRONTEND`
- [x] Scheduling / cancellation / rescheduling — confirmed working (e.g. Nifas config-version bump forces reschedule on copy changes). `FRONTEND`
- [x] Duplicate prevention — confirmed for Nifas; general pattern used elsewhere. `FRONTEND`
- [x] Privacy redaction — single centralized chokepoint (`pregnancyNotifications.ts::scheduleLocalNotification()`), confirmed to cover every notification type that uses it, `AndroidVisibility.PRIVATE` set explicitly. `FRONTEND` `PRIVACY` — **this session's earlier work**
- [x] Background/headless delivery — handled (`postpartumNifasBackgroundNotificationHandler.ts`, `notificationForegroundHandlers.ts`). `FRONTEND`
- [x] In-app notification center — rewritten this session to a one-AsyncStorage-key-per-notification-id model, fixing a race condition + a cross-JS-runtime lost-update risk between the main app and Android's headless background handler. `FRONTEND` — **fixed this session**
- [x] Contraception reminders — a real ON/OFF preference plus a real `reminderTime`, with an actual scheduled local notification via the shared chokepoint (as of this session); see §1.6 for the one known pre-existing permission-caching gap. `FRONTEND`
- [x] Qadaa post-Ramadan reminder — in-screen reactive card plus a real local scheduled notification (no backend), see §1.15. `FRONTEND`
- [x] Postpartum "Suivi quotidien" reminder — new this session: an optional, user-configurable recurring daily reminder (fatigue/sommeil/humeur/douleurs/récupération journal categories), fully independent from the automatic Nifas J35/J40 reminders. Real ON/OFF + `HH:mm` time in `postpartumPreferences.ts`, real scheduling via `postpartumReminderScheduling.ts` (shared `scheduleLocalNotification()` chokepoint), same canonical preference read/written by both the Postpartum onboarding screen and Profile → Santé générale → Notifications & rappels. Not yet real-device verified. `FRONTEND`

## 1.21 Export & Medical Sharing

- [x] Export screen — real UI (`DataExportScreen` in `BackupUtilityScreens.tsx`): period picker, CSV/PDF format picker, **objective-aware** category checkboxes (fixed this session — see below); loading/error states. `FRONTEND`
- [x] Objective-aware export — **fixed this session**: the export was a single generic `dailyJournalStore`-only feature regardless of active objective. Now `objectiveExportConfig.ts` defines real, audited categories per objective (Cycle/SOPK share the same categories — no dedicated SOPK store exists; TTC has its own distinct set — BBT/LH/glaire cervicale, not a Cycle copy; Pregnancy/Contraception/Postpartum/Fausse couche/Ménopause each read their own canonical store(s), never another objective's), and `medicalExportReaders.ts` has one reader function per objective reading ONLY that objective's real stores — structurally prevents cross-objective leakage (no shared "read everything" function exists). `FRONTEND` `MEDICAL`
- [x] CSV export — real `.csv` file written to the app cache directory (`medicalExportShare.ts`, `@dr.pogodin/react-native-fs`) and shared as a real file attachment (`react-native-share` — RN core `Share` cannot attach files on Android). Human-readable values, RFC 4180 escaping, UTF-8/French accents verified, per-objective data. `FRONTEND` `MEDICAL`
- [x] PDF export — real, locally-generated `.pdf` (`medicalExportPdf.ts`, `pdf-lib` — pure JS, no native linking). Sober chronological "Rapport de suivi" including the active objective's name, résumé + historique, only the user's selected categories, no invented medical interpretation. TTC's ovulation/fertile-window values are explicitly labeled "(estimation)" in both CSV and PDF, never presented as a confirmed fact — only shown once real cycle data has been confirmed (`hasConfirmedCycleData`), never derived from the still-default onboarding placeholder. `FRONTEND` `MEDICAL`
- [x] Clear medical history for a healthcare professional (cahier des charges) — satisfied frontend-side by the structured, objective-aware PDF report above; no doctor portal. `FRONTEND` `MEDICAL`
- [~] Premium gating for Medical Export — **re-audited this session, still not implemented.** No canonical Premium/subscription entitlement exists anywhere in the app (`HawaPremiumBottomSheet.tsx`'s "S'abonner" button is an explicit no-op stub — its own comment says "Ne pas activer Premium artificiellement" pending real Play Billing/StoreKit/RevenueCat integration; `premiumPricing.ts` prices are literal placeholders "Tarif à venir"). Export intentionally left fully accessible rather than gated behind a fake or unconnectable entitlement. `FRONTEND` `PREMIUM`
- [x] General data export (privacy right, spec §11, distinct from medical CSV/PDF) — fully functional: `DataManagementScreen`/`BackupDataScreen` → real raw-JSON dump of every `@awa`/`@hawa` key via the share sheet. Unaffected by this session's Medical Export work — confirmed still separate. `FRONTEND` `PRIVACY`
- [x] Loading/error states on export — present, disables duplicate export actions during generation. `FRONTEND`
- [x] `react-native-share`/RNShare TurboModule — diagnosed this session (a real-device `'RNShare' could not be found` report): autolinking config, `PackageList.java`, and the New Architecture codegen build artifacts for `RNShareSpec` all confirmed correctly generated by a fresh `gradlew assembleDebug`. Root cause is an APK installed before the dependency was added — native modules require a full rebuild+reinstall, a Metro-only reload is not enough. No code/config change was needed. `FRONTEND` `ANDROID`
- **Future, not in current scope:** temporary partner/professional sharing (spec explicitly marks this "option future"). `FUTURE`

## 1.22 Premium / Freemium UI

- [x] Paywall UI — fully designed and animated (`HawaPremiumBottomSheet.tsx`): benefit list, monthly/annual plan cards, per-country (DZ/MA/TN) pricing-note placeholder. `FRONTEND` `PREMIUM`
- [x] Canonical `isPremium` state — **implemented this session**: `src/state/premiumStore.ts` (`{isPremium, initialized, loading, purchaseInProgress, restoreInProgress, error}`, module singleton + subscribe pattern) is now the ONE frontend source of truth, read everywhere exclusively via `usePremium()` (`src/hooks/usePremium.ts`). No screen keeps its own local `isPremium`. `FRONTEND` `PREMIUM`
- [x] Subscribe/Restore action architecture — **implemented this session**: `src/services/purchaseService.ts` is the sole frontend service boundary (`initializePremium()`/`purchasePremium()`/`restorePurchases()`), with a concurrency guard against duplicate taps and a user-safe error message (never a raw SDK code). **No purchase SDK is installed yet** (confirmed: no react-native-iap/react-native-purchases/RevenueCat/Billing dependency in `package.json`) — every function fails safe (`isPremium` stays `false`, outcome `'unavailable'`), never fakes a successful purchase. `handleSubscribe()`/the Restore button in `HawaPremiumBottomSheet.tsx` are wired to this service with real loading/success/cancelled/error UI states; the sheet also now shows a distinct "Abonnement actif" state instead of the Subscribe CTA once `isPremium` is true. `FRONTEND` `PREMIUM` `!` REQUIRES A REAL PURCHASE SDK (Google Play Billing/StoreKit/RevenueCat) TO ACTUALLY SELL PREMIUM
- [x] Feature gates — **implemented this session** for the two benefits explicitly marketed on the paywall/Profile card with an unambiguous, currently-real UI surface to gate: Export (CSV & PDF, `DataExportScreen` in `BackupUtilityScreens.tsx`) and Cycle's "Statistiques avancées" (`StatisticsScreen.tsx`, the mock/preview 3/6/12-month screen). Reusable `PremiumLockedCard` component (`src/components/premium/PremiumLockedCard.tsx`) + the existing `HawaPremiumBottomSheet` (no second paywall screen) used for both. **Deliberately NOT gated** (ambiguous scope, no clear existing UI boundary to attach to, would require a product decision first): "Historique illimité" (no history-length limit exists anywhere to enforce), "Guides approfondis"/article-level gating (would need per-article Free/Premium classification across 72 articles — see §1.18's existing gap), "thèmes visuels supplémentaires" (no theming system exists at all), and the other 6 objectives' own Statistics screens (Pregnancy/TTC/Postpartum/Miscarriage/Menopause/Contraception — each shows genuinely real, live data via a structurally different UI — tabs or a different range concept — not the "3, 6 et 12 mois" shape the paywall specifically markets; locking them would mean inventing a boundary, not implementing a confirmed one). `FRONTEND` `PREMIUM`
- [x] Premium initialization at startup — **implemented this session**: `App.tsx` calls `initializePremium()` once at boot, alongside the app's other hydration calls. `FRONTEND` `PREMIUM`
- [x] Profile Premium card reactivity — **implemented this session**: `ProfileScreen.tsx`'s `PremiumProfileCard` now reads `usePremium()` and shows "Découvrir Premium" (free) or "Abonnement actif" (premium), updating immediately on any purchase/restore with no restart. `FRONTEND` `PREMIUM`
- [x] Free-tier experience remains the whole-app default for everything NOT explicitly gated above (cycle tracking, daily journal, mode pudeur, basic spiritual markers, Hijri calendar, status indicator, all other objectives' statistics) — core health tracking was never touched. `FRONTEND` `FREE`
- [~] Pricing — `premiumPricing.ts` still contains hardcoded placeholder values (`'Tarif à venir'`), explicitly marked TODO in-code — unrelated to this session's architecture work, still pending real store pricing. `FRONTEND` `PREMIUM`

## 1.23 Responsive / Accessibility / Quality

- [x] Small-device responsiveness (Samsung Galaxy A13 class) — extensively addressed this session across every screen touched (compact/veryCompact breakpoints, `useWindowDimensions`, safe-area-aware padding via `TOP_SPACING_EXTRA`/`TOP_SPACING_EXTRA_COMPACT`). `FRONTEND`
- [x] Status bar / navigation bar / safe areas — consistently handled via `react-native-safe-area-context` across all touched screens. `FRONTEND`
- [x] Keyboard handling — `KeyboardAvoidingView` used consistently in journal entry screens. `FRONTEND`
- [~] App-wide accessibility audit (labels, touch targets, text scaling) — spot-checked and generally present (`accessibilityLabel`/`accessibilityRole` used throughout screens touched this session) but **not exhaustively audited across every screen in the app** — recommend a dedicated accessibility pass before release. `FRONTEND`
- [x] No fixed dimensions clipping content — actively avoided pattern in all work done this session (flex layouts, `ScrollView`, `numberOfLines` with `adjustsFontSizeToFit` where needed). `FRONTEND`

---

# 2. BACKEND

**Verdict up front: this project currently has NO production backend.** Zero server/API/database code exists anywhere in the repository. The only outbound network calls in the entire app are 3 third-party `fetch()` calls (Aladhan prayer-times API, MapTiler geocoding, MapTiler map style) — none to a HAWA-owned service. All 29 state stores are independent AsyncStorage-backed local files with zero sync. Notifications are local-only (`@notifee/react-native`, no FCM/OneSignal). No IAP library exists. Every item below is therefore genuinely **from-scratch**, not "connect an existing backend."

## 2.1 Backend Architecture

- [ ] API architecture, database choice — `[!]` ARCHITECTURAL DECISION REQUIRED. Nothing chosen yet in code or config. Given the privacy-first positioning, recommend evaluating a backend that supports field-level encryption and minimal-retention design from day one, not a generic CRUD API retrofitted with encryption later.
- [ ] Anonymous vs. registered user data model on the server — `[!]` ARCHITECTURAL DECISION REQUIRED, must mirror the already-built local `anonymousMode` concept without requiring email.
- [ ] Session/token management, API versioning, logging, monitoring, rate limiting, backups — none exist; all `[!]` ARCHITECTURAL DECISION REQUIRED / `[ ]` Todo once architecture is chosen.

## 2.2 Authentication

- [ ] Anonymous accounts (server-side) — must preserve the already-generated local anonymous ID (`ensureAnonymousAccount()`) as a migration path, not replace it. `BACKEND`
- [ ] Registered accounts, secure auth, session management — Login/Register/Forgot-password screens are fully built on the frontend and waiting for this. `BACKEND` `SECURITY`
- [ ] Anonymous → registered migration — the frontend already flips a local flag on registration (`RegistrationScreen.tsx`); backend equivalent (associate existing anonymous data with a new real account) needs designing so no local data is lost in the transition. `BACKEND`
- [ ] Account deletion (server-side) — frontend already has 2 working local-deletion flows (§1.21/§2.20); backend must mirror this once accounts exist. `BACKEND` `PRIVACY`
- [ ] Password reset, email verification — frontend UI exists as non-functional stubs, waiting for this. `BACKEND`

## 2.3 User Profile

- [ ] Server persistence for profile/objective/spiritual-markers-preference/settings/units/onboarding answers — currently 100% local; plan minimal-collection sync mirroring existing `onboardingPreferences.ts`/`personalInformationStore.ts`/`securityPreferences.ts` shapes. `BACKEND` `PRIVACY`

## 2.4 Cycle Data

- [ ] Periods, cycle history, flow, fertile window/ovulation calculations, irregular cycles — mirror existing `PeriodHistoryRecord[]`/`CyclePreferences` shape from `onboardingPreferences.ts`; keep raw observations (period starts) separate from derived predictions (the frontend already does this split via `computeCyclePredictionStatus()` — preserve it server-side too, don't just store the derived number). `BACKEND` `MEDICAL`

## 2.5 Daily Journal Data

- [ ] Symptoms/mood/stress/energy/intimate/sleep/activity/notes/photos — mirror `dailyJournalStore.ts`'s `DailyJournalEntry` shape; intimate fields and notes need explicit sensitive-field protection design (see §2.14), not generic-field treatment. `BACKEND` `PRIVACY` `MEDICAL`

## 2.6 TTC Data

- [ ] Basal temperature, cervical mucus, LH tests, intercourse — same `dailyJournalStore` fields as §2.5 (`temperature`/`cervicalMucus`/`lhTest`/`intimacy`); do not duplicate cycle-history storage, TTC already reuses the Cycle history model 1:1 on the frontend. `BACKEND` `MEDICAL`

## 2.7 Contraception Data

- [ ] Method, doses/events, missed-dose/delay history, schedule, reminder config — the frontend model is now mature and real (as of this session; see §1.6): mirror `contraceptionPreferences.ts` (method/start date/`pillScheduleType`+`activeDays`+`breakDays`/reminder time), `contraceptionIntakeHistoryStore.ts` (pill/other's `Record<date, {status:'taken'|'late'|'missed', recordedAt}>`), and `contraceptionEventStore.ts` (ring/patch's `Record<date, event[]>`) shapes — same "mirror the existing frontend model" approach already used for Pregnancy (§2.9). `BACKEND` `MEDICAL`

## 2.8 SOPK / Irregular Cycle Data

- [ ] Irregular cycle observations, acne, hirsutism, weight, pain, mood, fatigue, associated symptoms — **frontend model now exists and is mature** (as of this session; see §1.7): mirror `irregularPreferences.ts` (`cyclePattern`/`lastPeriodDate`/`trackedItems`/reminder config) and `irregularJournalStore.ts` (`IrregularJournalEntry`: `acne`/`hairGrowth`/`weight`/`pain`/`mood`/`fatigue`/`symptoms[]`) shapes — same "mirror the existing frontend model" approach already used for Contraception (§2.7)/Pregnancy (§2.9). Real "Règles" data still lives in the shared `dailyJournalStore`/`confirmedPeriodHistoryStore` (§2.5), not a SOPK-only copy. `BACKEND` `MEDICAL`

## 2.9 Pregnancy Data

- [ ] Pregnancy profile, due date, progression, appointments, exams, symptoms, weight, mood, sleep, medication/reminder data — mirror `pregnancyPreferences.ts`/`pregnancyJournalStore.ts`/`pregnancyMedicalEventsStore.ts` shapes (all already well-modeled on the frontend). `BACKEND` `MEDICAL`

## 2.10 Postpartum Data

- [ ] Delivery, lochia entries/completion, cycle return, breastfeeding, amenorrhea, journal, recovery — mirror `postpartumJournalStore.ts`/`postpartumLochiaStore.ts`/`postpartumPreferences.ts`. `BACKEND` `MEDICAL`

## 2.11 Miscarriage Data

- [ ] Event/context, bleeding, symptoms, cycle return, notes, transition back to TTC — mirror `miscarriageJournalStore.ts`/`miscarriagePreferences.ts`. Treat as especially sensitive health data (spec doesn't single this out, but the domain warrants it). `BACKEND` `PRIVACY` `MEDICAL`

## 2.12 Spiritual Data

- [ ] Persist only: spiritual-markers-enabled flag, qadaa progress state, relevant preferences, Nifas acknowledgement/reference state where cross-device sync is genuinely needed — mirror `qadaaProgressStore.ts`/`postpartumNifasReminderStore.ts`'s minimal shapes. **Do not** collect prayer-time location history, purity-status history, or any granular religious-observance log beyond what the frontend already keeps locally — this is explicitly a privacy-sensitive design decision worth flagging. `BACKEND` `PRIVACY` `RELIGIOUS-CONTENT`

## 2.13 Notification Backend

- [x] Current architecture (local-only via `@notifee/react-native`) is **already correct and should mostly stay local** — cycle/pregnancy/postpartum/journal/Nifas/qadaa reminders don't need server-side push, they're personal date-math reminders the device can compute and schedule itself. `BACKEND`
- [ ] If/when multi-device sync is added, decide what (if anything) genuinely needs remote push vs. staying local-per-device — `[!]` ARCHITECTURAL DECISION REQUIRED, default to "keep local" unless a real multi-device use case is confirmed.
- [ ] If remote push is ever added: device tokens, token rotation, privacy-safe payloads (never put sensitive health/religious detail in a push payload — the frontend already does this correctly for local notifications via the centralized redaction chokepoint; a remote equivalent must replicate that, not regress it). `BACKEND` `PRIVACY`

## 2.14 Security & Encryption — **HIGH PRIORITY**

- [~] PIN/biometric secrets — **already correctly done**, even without a backend: stored in the OS Keychain (`react-native-keychain`), never AsyncStorage, salted-hash where applicable. Keep this pattern; don't regress it when a backend arrives. `SECURITY`
- [x] Encryption at rest for "Vie intime"/"Rapports" (`DailyJournalEntry.intimacy`) — **implemented.** `src/services/privateJournalEncryption.ts` (new) encrypts with AES-256-GCM via `@noble/ciphers@2.3.0` (fresh random 12-byte nonce per save, auth tag embedded in ciphertext, hex-encoded, versioned payload `{version, iv, ciphertext}`), with randomness supplied by `react-native-get-random-values@1.11.0` (new, small native Android module, verified via a full `./gradlew :app:assembleDebug`). The AES key itself is a random 256-bit value stored in the OS Keychain (`react-native-keychain`, `WHEN_UNLOCKED_THIS_DEVICE_ONLY` — same tier already used for the PIN verifier), never derived from the PIN, never written to AsyncStorage. Three independent layers, deliberately not conflated: Android device lock protects the key, the existing Vie-Intime PIN/Face ID controls UI visibility, AES-GCM protects data at rest. Legacy plaintext `intimacy` entries are read transparently (`resolveIntimacySection()`) and migrate to the encrypted `encryptedIntimacy` field lazily, only the next time that specific day is saved — no global/destructive migration, the old field is only deleted after the new encrypted write succeeds. A corrupted/tampered payload shows an honest "Impossible de lire ces données privées." message (both `JournalIntimacyScreen.tsx` and `JournalConceptionReportsScreen.tsx`) and is never auto-deleted. Two centralized display-only resolvers (`withResolvedIntimacyForDisplay`/`withResolvedIntimacyForDisplayMany`, built on the same one decrypt path) feed the Dashboard progress card, Calendar day markers/detail card, and TTC statistics with only the minimum needed (`{answer}`, never libido/protection/discomfort/note/time) — no scattered decrypt logic, no plaintext sidecar ever persisted. `SECURITY` `PRIVACY` `MEDICAL`
- [ ] Encryption in transit — not yet applicable (no backend calls exist to a HAWA-owned service yet), but must be TLS-only by design once one exists. `BACKEND` `SECURITY`
- [ ] Secrets management, secure token storage — plan alongside §2.2, reuse the Keychain pattern already proven for PIN codes. `BACKEND` `SECURITY`
- [ ] Access control / authorization / audit logging / incident handling / backups / deletion at the infra level — all `[!]` ARCHITECTURAL DECISION REQUIRED, none exist since no backend exists.
- [x] `android:allowBackup="false"` already set — correctly prevents ADB/cloud-backup extraction of local data (a real, if partial, mitigation already in place). `SECURITY`

## 2.15 Private Photos

- [x] Frontend/local functionality — done, see §1.4. Up to 5 photos per day, PIN/Face-ID-gated, local URI references via `dailyJournalStore.ts`, backward-compatible with the earlier single-photo entries, no encryption. `FRONTEND` `PRIVACY`
- [x] Durable app-owned local photo-file storage — done, see §1.4. Copied out of the picker's temporary/cache location into `RNFS.DocumentDirectoryPath` via `@dr.pogodin/react-native-fs`, on Save only. `FRONTEND`
- [x] Encryption at rest — implemented, see §1.4/§2.14. AES-256-GCM, separate Keychain key from the intimacy encryption, non-destructive lazy migration for legacy plaintext photos, no plaintext temp file at display time. `SECURITY` `PRIVACY`
- [ ] Secure upload, authenticated retrieval, signed/temporary URLs, remote deletion, metadata minimization, backend/cloud storage — entirely `[ ]` Todo, blocked on backend architecture (§2.1) not existing yet. `BACKEND` `SECURITY` `PRIVACY` `!`

## 2.16 Sync & Offline Mode

- [ ] Offline creation/edits, retry, conflict resolution, last-sync state, deletion sync, idempotency — all `[!]` ARCHITECTURAL DECISION REQUIRED.
- [!] **Critical constraint for whoever builds this**: 29 independent local stores with real user data already exist and are actively used. Any sync-layer migration plan must treat these as the source of truth to migrate FROM, never destroy them, and must handle the fact that some stores (e.g. `dailyJournalStore`) are shared across multiple objectives while others (e.g. `pregnancyJournalStore`) are objective-specific — a naive "sync everything the same way" design will not fit this shape. `BACKEND`

## 2.17 Statistics Backend

- [ ] Decide local vs. server-side vs. hybrid computation — `[!]` ARCHITECTURAL DECISION REQUIRED. Recommend **local-first**, matching the privacy positioning: all current statistics (base + the mock 3/6/12-month UI) are already computed client-side from local data; there's no functional need to move this server-side purely for "convenience." `BACKEND` `PRIVACY`
- [ ] Real 3/6/12-month trend computation (replacing `StatisticsScreen.tsx`'s current `PREVIEW_DATA` mock) — this can very likely be done **entirely on-device** from the existing `getJournalEntriesForMonth`-style APIs already used elsewhere in the app (Cycle/Conceive calendars already do month-bucketed real queries) — flag this as primarily a **frontend** task, not a reason to wait for backend. `FRONTEND` (cross-referenced from §1.17)

## 2.18 Export PDF / CSV

- [ ] Decide local vs. server-side generation — recommend **local-first** for privacy (no need to transmit sensitive health data to a server just to render a PDF); a local PDF library (e.g. one producing a real file, replacing the current `Share.share(text)` approach) would resolve both the CSV-as-file and PDF-stub gaps without any backend at all. `BACKEND` `!` ARCHITECTURAL DECISION REQUIRED — **default recommendation: don't build this server-side unless a real requirement forces it**

## 2.19 Subscriptions / Premium

- [ ] Real subscription status / entitlement / purchase verification / restore / expiration / cancellation — **nothing exists**: no IAP library in `package.json`, no `isPremium` state anywhere, `handleSubscribe()` is an explicit no-op with a "do not fake this" dev comment already in the code (a good sign of engineering discipline, not a shortcut waiting to be exploited). `BACKEND` `PREMIUM` `!` ARCHITECTURAL DECISION REQUIRED (Play Billing direct integration vs. RevenueCat/similar abstraction layer)
- [ ] Regional pricing (Algérie/Maroc/Tunisie) — currently a placeholder string (`'Tarif à venir'`) in `premiumPricing.ts`; this is a **product/payment decision**, not a hardcoded assumption to make in code — flag explicitly for business input before implementation. `BACKEND` `PREMIUM`
- [ ] Server-side entitlement check for any future feature gate — do not trust a local boolean once this exists (spec-adjacent best practice, not explicitly stated but standard for subscription integrity). `BACKEND` `PREMIUM` `SECURITY`

## 2.20 Account Data Export / Deletion

- [x] **Local deletion already fully solved** — two real, working, "type SUPPRIMER to confirm" flows exist today: full `AsyncStorage.clear()` (`DeleteAccountScreen`) and scoped `@awa`/`@hawa`-prefix-only wipe (`deleteTrackedData()` in `backupService.ts`). This is genuinely done, not just UI. `FRONTEND` `PRIVACY`
- [ ] Server-side equivalent (once accounts exist): delete account, delete health data, delete photos, revoke sessions, deletion confirmation, retention policy, backup deletion strategy — all `[ ]` Todo, blocked on §2.1/§2.2. `BACKEND` `PRIVACY` `!`

## 2.21 Content Management

- [x] Current approach (articles bundled in-app via `libraryContent.ts`) is a **legitimate, working choice today** — 72 real articles ship with the app, no CMS needed for the current content volume. `FRONTEND`
- [ ] If/when a CMS becomes necessary (frequent content updates without app releases, or true per-article validation-status tracking) — plan article model, categories, Free/Premium flag, versioning, publication state, **religious-content validation state**, **medical-content validation state**, localization. `BACKEND` `!` ARCHITECTURAL DECISION REQUIRED
- [!] **Do not publish any article's validation status as "true" unless it has actually been reviewed** — directly relevant since today's data model has no such field at all (§1.18). If a CMS is built, this field must exist and default to unvalidated, not validated. `RELIGIOUS-CONTENT` `MEDICAL`

## 2.22 Admin / Content Validation

- [ ] Admin workflow for content/religious-content/publication status — not built, and per the instructions, **should not be built speculatively**; mark as a product-scope decision pending whether a CMS (§2.21) is even needed first. `BACKEND` `!` ARCHITECTURAL DECISION REQUIRED

---

# 3. Cross-Cutting Security Checklist

| Area | Status | Note |
|---|---|---|
| Health data at rest | 🔴 Gap | Plaintext AsyncStorage — see §2.14 |
| Intimate data at rest | 🟢 Fixed | "Vie intime"/"Rapports" now AES-256-GCM-encrypted at rest (§2.14), Keychain-protected key, gated by the existing PIN/Face ID. Generic private notes (`note`) remain plaintext, same gap as health data below |
| Religious data | 🟡 Low risk | Minimal data collected today (just a toggle + qadaa counts); keep it that way (§2.12) |
| Private photos | 🟢 Fixed | Frontend/local functionality + durable app-private file storage exist (§1.4/§2.15); photo file contents are now AES-256-GCM-encrypted at rest, separate Keychain key from intimacy encryption, gated by the existing PIN/Face ID |
| Authentication | 🔴 Gap | Entirely non-functional today (UI-only); real risk once "launched" if not fixed before backend ships |
| App-wide lock arming | 🟡 Partial bug | Doesn't arm on cold launch (§1.19) — a concrete, scoped fix |
| Encryption in transit | ⬜ N/A yet | No HAWA-owned backend calls exist yet |
| Notifications | ✅ Good | Centralized redaction, `AndroidVisibility.PRIVATE`, confirmed working |
| Analytics | ✅ Clean | None integrated — consistent with the no-tracking promise, but zero crash visibility either |
| Logs | 🟡 Unaudited | No crash/log SDK exists; recommend a privacy-reviewed crash reporter before wide release, not none forever |
| Crash reporting | ⬜ Missing | None integrated (see above) |
| Backups (device-level) | ✅ Good | `android:allowBackup="false"` correctly blocks ADB/cloud extraction |
| Backups (app's own backup feature) | 🟡 Unaudited | `BackupDataScreen.tsx`/`backupService.ts` exist (Wi-Fi-only toggle, frequency options) — not deep-audited this round for where backups are stored/encrypted; flag for follow-up |
| Exports | 🟡 Partial | Raw JSON export = full unencrypted personal-data dump via OS share sheet; fine for user-initiated "give me my data," but worth being deliberate about the sharing surface |
| Account deletion | ✅ Good | Two real, working local flows |

---

# 4. Free vs Premium Matrix

| Feature | Free | Premium | Current status |
|---|---|---|---|
| Cycle tracking | ✅ | ✅ | Done, unguarded (correct — it's Free per spec) |
| Daily journal | ✅ | ✅ | Done, unguarded (correct) |
| Mode pudeur / privacy | ✅ | ✅ | Done, unguarded (correct) |
| Basic spiritual markers (Hijri, status indicator) | ✅ | ✅ | Done, unguarded (correct) |
| Advanced statistics (Cycle's 3/6/12-month trends) | ❌ | ✅ | **Gated this session** (`StatisticsScreen.tsx`) — still mock data underneath, but the gate itself is real and reactive |
| Medical PDF/CSV export | ❌ | ✅ | **Gated this session** (`DataExportScreen`) — real `.csv`/`.pdf` files (see §1.21), now behind the same canonical Premium check |
| Other 6 objectives' Statistics screens | ✅ (unchanged) | ✅ (unchanged) | Deliberately left free — real/live data, structurally different UI (tabs or day/shorter-month ranges), no confirmed product mapping to the paywall's "3, 6 et 12 mois" wording; flagged as a pending product decision, not gated |
| Deeper educational content | ❌ | ✅ | All 72 articles still open to everyone; no gate implemented (would need per-article Free/Premium classification first — product decision required, not invented this session) |
| Unlimited history | ❌ | ✅ | No history limit currently enforced for anyone anywhere in the app; nothing to gate without first defining what the Free limit would even be — product decision required |
| Extra visual themes | ❌ | ✅ | No theme system exists at all — nothing to gate; feature not yet built |

**Net finding (updated this session): the canonical frontend Premium architecture (`premiumStore.ts`/`usePremium()`/`purchaseService.ts`/`PremiumLockedCard`) now exists and is wired into the two benefits with an unambiguous, currently-real UI surface (Export, Cycle's advanced statistics). The app still cannot sell Premium for real — no purchase SDK is installed, so `purchasePremium()`/`restorePurchases()` always report `'unavailable'` and `isPremium` can never become `true` outside of a test override — but the frontend is now "ready for the existing/native purchase SDK integration" as requested, with no fake/hardcoded entitlement anywhere. The remaining three marketed benefits (Historique illimité, Guides approfondis, Thèmes) need an explicit product decision on their exact boundary before a gate can be implemented honestly.

---

# 5. Final Implementation Roadmap

## Phase 1 — Finish core frontend gaps
- **Objective:** close the concrete, scoped frontend gaps that don't require a backend or a product decision.
- **Frontend work:** fix app-lock cold-launch bug (§1.19); align Nifas completion-popup copy with the divergence-aware framing (§1.11); add a Hijri accuracy disclaimer (§1.16). Library category-count badges — already fixed, see §1.18. Objective picker decision resolved — see §1.1 (keep all 8, done).
- **Backend work:** none.
- **Dependencies / blocking:** none — these are all self-contained.
- **Definition of done:** each item verified against its own audit note above, `tsc`/lint clean.

## Phase 2 — Real 3/6/12-month statistics on real data
- **Objective:** replace `StatisticsScreen.tsx`'s mock `PREVIEW_DATA` with genuinely computed trends, using the same month-bucketing approach already proven in Cycle/Conceive calendars.
- **Frontend work:** implement real month-range aggregation from `dailyJournalStore`/`onboardingPreferences` period history.
- **Backend work:** none — this is achievable entirely client-side.
- **Dependencies:** none.
- **Definition of done:** all three range options show real, verifiably-correct numbers; empty states remain honest when data is insufficient.

## Phase 3 — Security/privacy hardening
- **Objective:** close the two highest-severity findings — plaintext content storage and the app-lock cold-launch gap (the latter is also in Phase 1; list here for emphasis).
- **Frontend/local work:** design and implement real encryption-at-rest for journal/intimate content (§2.14) — this can start **before** a backend exists, since it's about how data sits in local storage today.
- **Backend work:** none required to start this phase.
- **Dependencies:** a decision on the encryption approach (device-keyed vs. passphrase-derived key) — `[!]` ARCHITECTURAL DECISION REQUIRED.
- **Definition of done:** sensitive fields are no longer recoverable as plaintext from a raw AsyncStorage/file-system dump.

## Phase 4 — Backend foundation
- **Objective:** stand up the first real backend service (auth, base API, database) per §2.1–§2.3.
- **Frontend work:** wire the already-built Login/Register/Anonymous-mode UI to real endpoints (screens exist, just need real calls — significant rework avoided).
- **Backend work:** everything in §2.1–§2.3.
- **Dependencies:** `[!]` ARCHITECTURAL DECISION REQUIRED (backend stack/hosting).
- **Definition of done:** a real account can be created, logged into, and an anonymous-to-registered migration works without data loss.

## Phase 5 — Backend data + synchronization
- **Objective:** sync the 29 local stores to the backend without destroying existing local data.
- **Frontend work:** add sync-status UI where useful (last-synced indicator, conflict surfaces).
- **Backend work:** §2.4–§2.13, §2.16.
- **Dependencies:** Phase 4 complete.
- **Definition of done:** a user's data survives an app reinstall / new device, with local-first behavior preserved offline.

## Phase 6 — Premium / subscriptions
- **Objective:** make the Free/Premium matrix in §4 actually real.
- **Frontend work:** wire `HawaPremiumBottomSheet`'s subscribe button to a real IAP library; add the actual feature gates identified in §1.17/§1.18/§1.21/§1.22.
- **Backend work:** §2.19 (entitlement verification, restore, regional pricing decision).
- **Dependencies:** Phase 4 (need real accounts to attach entitlement to), a payment/pricing product decision.
- **Definition of done:** a real purchase unlocks real gated features; Free users see honest locked-state UI instead of full access.

## Phase 7 — Export & medical history
- **Objective:** make CSV a real file and build real PDF export.
- **Frontend work:** replace `Share.share(text)` with a real file-based share (CSV as an actual `.csv`); integrate a PDF generation library for a real clinical-style export.
- **Backend work:** likely none if generated on-device (recommended default, §2.18).
- **Dependencies:** none technical; benefits from Phase 6 if export stays Premium-gated.
- **Definition of done:** a user can produce and share/save a real CSV file and a real PDF document.

## Phase 8 — Content validation
- **Objective:** get every religious article scholar/organization-reviewed, and make that status visible in the data model.
- **Frontend work:** none required unless a "validated" badge is desired in the reader UI.
- **Backend work:** add a `validated`/`reviewStatus` field if/when a CMS (§2.21) is built; otherwise track validation status alongside the static content file itself.
- **Dependencies:** external — scholar/organization engagement is a product/business task, not an engineering one.
- **Definition of done:** every `fiqhWomen`/`istihada`/`nifasFiqh` article, plus the Nifas completion-popup copy, has documented sign-off.

## Phase 9 — QA / production readiness
- **Objective:** final hardening before release.
- **Frontend work:** full accessibility pass (§1.23), decide on crash reporting with a privacy review. SOPK is now built out (see §1.7), joining Contraception (§1.6) and Menopause (§1.8) — all 8 objectives now have their own dedicated Dashboard/Calendar/Statistics/Journal, none silently behaving like plain Cycle tracking.
- **Backend work:** logging/monitoring/rate-limiting/backup verification (§2.1).
- **Dependencies:** all prior phases.
- **Definition of done:** no feature silently behaves differently than its UI promises; crash visibility exists without compromising the no-analytics promise; security checklist (§3) is fully green.

---

## Store inventory (for reference — do not remove any of these; they are candidates for future sync, not dead code)

`appLockStore`, `calendarFilters`, `conceptionPreferences`, `confirmedPeriodHistoryStore`, `dailyJournalStore`, `generalHealthStore`, `inAppNotificationStore`, `irregularJournalStore`, `irregularPreferences`, `libraryStore`, `miscarriageJournalStore`, `miscarriagePreferences`, `onboardingPreferences`, `personalInformationStore`, `postpartumJournalStore`, `postpartumLochiaStore`, `postpartumNifasReminderStore`, `postpartumPreferences`, `postpartumSuccessToastStore`, `pregnancyCustomRemindersStore`, `pregnancyHealthRemindersStore`, `pregnancyJournalStore`, `pregnancyMedicalEventsStore`, `pregnancyNotificationSettingsStore`, `pregnancyPreferences`, `privateSectionAuthStore`, `profileAvatarPreferences`, `qadaaProgressStore`, `qadaaStore`, `quickActionsPreferences`, `securityPreferences` — **31 total**, all AsyncStorage-backed, zero sync today.
