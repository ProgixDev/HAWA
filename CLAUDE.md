# AWA — Project Instructions (AWA Development Guardian)

This file is loaded automatically for every Claude Code session in this repository. It is the **permanent, always-on** guardrail system for AWA development — read it before making any change, not just when a task explicitly mentions it.

AWA is a menstrual/fertility/health-tracking app for francophone Muslim women (React Native CLI, Android-first, TypeScript). It already has a real, working design and architecture. **Your job is never to redesign AWA — it is to make every new piece of work look and behave like it already belongs inside the existing app.**

A companion on-demand agent exists at `.claude/agents/awa-guardian.md` for deep pre-implementation/pre-merge reviews on larger tasks. This file (`CLAUDE.md`) is the automatic baseline that always applies; the agent is opt-in and must be explicitly invoked.

**Repository layout note:** the React Native application now lives entirely under `mobile/` (this repo was reorganized into a `mobile/` / `web/` / `backend/` layout; `web/` and `backend/` are empty placeholders for future work). Every app-relative path referenced below (`src/...`, `android/...`, `ios/...`, `App.tsx`, `package.json`, `TODO.md`'s own screen/store references, etc.) is relative to `mobile/`, i.e. `mobile/src/...`, `mobile/android/...`, `mobile/App.tsx`. `TODO.md` itself stays at the repository root by design (see §0's authority hierarchy) even though its content describes the app under `mobile/`.

---

## 0. Authority hierarchy

When sources disagree, resolve in this order — and if the cahier des charges and the existing implementation genuinely conflict, **report the conflict explicitly instead of silently picking one**:

1. The user's explicit current instruction
2. The official cahier des charges (pasted into conversation history this session — **no file of it is committed to the repo**; if asked to persist it, flag that it doesn't exist as a file yet)
3. This file — permanent AWA development rules
4. `TODO.md` at the repo root, if present (a snapshot audit, not a spec — it does not override #2 or #3)
5. Existing implementation/patterns in the codebase

## 1. REUSE → EXTEND → CREATE

Before writing anything new, search in this order and prefer the earliest match:

1. **Reuse** an existing screen/component/store/service/util/route as-is.
2. **Extend** the closest existing one (an optional prop, an added branch) if it almost fits.
3. **Create** something new only when neither of the above is honestly possible.

Never create a second implementation of something that already exists (a second card style, a second store for the same data, a second toast, a second calendar day-cell component) unless objective-specific behavior genuinely requires it.

## 2. The real AWA design language (grounded in actual code — do not invent a new one)

- **Theme tokens** — `src/components/home/homeTheme.ts` exports `homeColors` (`primary` `#6D4AE8`, `textPrimary` `#2F2258`, `textSecondary` `#746D92`, `lightLavender` `#F7F3FF`, `cardBorder` `rgba(109,74,232,0.14)`, plus `pink`, `primaryDark`, `green`), `homeRadii`, `homeShadow`. Import these; never hardcode a new hex value that duplicates an existing token.
- **Canonical page background** (used by every objective's Dashboard/Calendar today): `LinearGradient` with `colors={['#FAF8FD','#F4EFFA','#EEE7F7','#E9E1F3']}`, `locations={[0,0.32,0.7,1]}`, diagonal `start`/`end`, plus 3 soft absolutely-positioned decorative "glow" `View`s behind the content. Reuse this verbatim on any new full-screen page in the same family — never invent a different gradient/background per screen.
- **Cards** — white/near-white background, 1px `cardBorder`, soft shadow (`homeShadow`), large rounded corners (`homeRadii.card`), serif font-family for titles, sans-serif body text, generous but not excessive padding.
- **Spacing / safe areas** — `TOP_SPACING_EXTRA` / `TOP_SPACING_EXTRA_COMPACT` from `src/theme/spacing.ts` for safe-area-aware top padding. Standard responsive breakpoint pattern seen throughout the app:
  ```ts
  const {width, height} = useWindowDimensions();
  const compact = width < 380 || height < 720;
  const veryCompact = width < 340 || height < 640;
  ```
- **Calendar "Today" cell** — dashed border + neutral lavender fill that must always win over any colored period/fertile/ovulation/selected background, so journal-category dots stay legible; this was fixed across all 5 calendar implementations this session (`MonthCalendarCard.tsx`, `ConceiveCalendarContent.tsx`, `MiscarriageCalendarContent.tsx`, `PostpartumCalendarContent.tsx`, `PregnancyCalendarContent.tsx`) — do not regress it.
- **Journal entry screens** — shared `JournalScreenLayout` / `SectionCard` / `ChoiceChips` / `LabeledInput` (`src/components/journal/`). Save confirmations use the shared `JournalSaveToast` (spring-in, timed fade-out, purple check-circle icon) — never a bare `Alert.alert` for a successful save.
- **Premium means refinement, not decoration** — sober, calm, feminine without stereotype (no baby-pink), no oversized titles/cards, no excessive gradients/illustrations/shadows/animation. Animations are subtle, purposeful, and match existing timing conventions (spring params like `damping:17, stiffness:180, mass:0.85` recur throughout the journal/toast code) — never constant looping motion for its own sake.

## 3. Architecture map (what exists — search here before adding anything)

- **Objective-aware routing triad**: `src/screens/HomeScreen.tsx` / `ObjectiveAwareCalendarScreen.tsx` / `ObjectiveAwareStatisticsScreen.tsx` / `src/navigation/MainTabNavigator.tsx`'s `JournalSheetHost`. Each branches on `ObjectiveId`: `pregnancy`, `postpartum`, `loss`, `conceive` have dedicated components; `cycle`, `contraception`, `irregular` (SOPK), `menopause` all currently fall through to the same generic Cycle screens (`CycleHomeScreen.tsx`, `CalendarScreen.tsx`, `StatisticsScreen.tsx`) — this is a known, documented state (see `TODO.md`), not a bug to silently "fix" by inventing SOPK/menopause/contraception features unless explicitly asked.
- **Per-objective journal-category config pattern**: `src/config/postpartumJournalConfig.ts`, `miscarriageJournalConfig.ts`, `conceptionJournalConfig.ts` — each is ONE shared array consumed by both the Dashboard "Suivi du jour" card and the "Journal quotidien" sheet, so the two can never drift apart. Follow this exact pattern for any new objective-specific journal category set — never hand-maintain the same category list twice.
- **`src/utils/cycleMath.ts`** — the single shared cycle/fertility/date-formatting utility (`phaseFor`, `cycleDayFor`, `ovulationDayFor`, `computeCyclePredictionStatus`, `formatHijriDate`/`formatHijriDay`/`formatHijriMonthYear`, `sameDay`, `startOfDay`, `diffDays`, `addDays`, `WEEK_DAYS`). Never reimplement cycle/fertility math elsewhere — predictions must use personal history (`computeCyclePredictionStatus`'s `exact`/`window`/`observing` modes), never a flat 28-day assumption.
- **Date-key convention**: `date.toLocaleDateString('en-CA')` (local `YYYY-MM-DD`) is used consistently at ~40+ call sites across the entire app. **Never** use `date.toISOString().slice(0,10)` (UTC-based — can shift the calendar day near midnight for negative-UTC-offset users).
- **Local stores** (`src/state/`, all AsyncStorage-backed, **29 total**, zero backend sync today): `appLockStore`, `calendarFilters`, `conceptionPreferences`, `confirmedPeriodHistoryStore`, `dailyJournalStore`, `generalHealthStore`, `inAppNotificationStore`, `libraryStore`, `miscarriageJournalStore`, `miscarriagePreferences`, `onboardingPreferences`, `personalInformationStore`, `postpartumJournalStore`, `postpartumLochiaStore`, `postpartumNifasReminderStore`, `postpartumPreferences`, `postpartumSuccessToastStore`, `pregnancyCustomRemindersStore`, `pregnancyHealthRemindersStore`, `pregnancyJournalStore`, `pregnancyMedicalEventsStore`, `pregnancyNotificationSettingsStore`, `pregnancyPreferences`, `privateSectionAuthStore`, `profileAvatarPreferences`, `qadaaProgressStore`, `qadaaStore`, `quickActionsPreferences`, `securityPreferences`. Search this list before adding a new store — most new data belongs inside an existing one (e.g. `dailyJournalStore` is shared by Cycle **and** Conceive; do not create a parallel store for a category that already has a home there).
- **Sync pattern**: Dashboard/Calendar screens re-read store data via `useFocusEffect` (not a mount-only `useEffect`) so saves reflect immediately on `navigation.goBack()`. The most robust objectives (Miscarriage, Postpartum) additionally use a pub/sub `subscribe...()` call for live updates while the screen stays mounted — prefer that combo (`useFocusEffect` + `hydrate...().then(setState)` + `subscribe...()`) for anything where staleness would be noticeable.
- **Notification chokepoint**: `src/services/pregnancyNotifications.ts`'s `scheduleLocalNotification()` is the **only** place that should schedule a local notification across the whole app — it centralizes discreet-notification/hide-preview redaction and sets `AndroidVisibility.PRIVATE`. Never call `@notifee/react-native` directly from a new feature; route through this function.
- **Two separate PIN/privacy systems — do not conflate them**: (a) the whole-app lock (`appLockStore.ts` / `AppLockScreen.tsx` / `appSecurityService.ts`, Keychain-backed via `react-native-keychain`), and (b) the narrower "Vie intime"/"Rapports" gate (`privateSectionAuthStore.ts` / `PrivateIntimacyUnlockScreen.tsx` / `PrivateIntimacyPinScreen.tsx` / `PrivateIntimacyFaceIdScreen.tsx`). A change to one must never silently affect the other.
- **Backend status: none exists.** The app is 100% local AsyncStorage today — no server, no real auth, no IAP, no remote push (notifications are local-only via `@notifee/react-native`). Do not assume, stub, or silently add calls to a project-owned API that doesn't exist; see `TODO.md` §2 for the actual backend plan.

## 4. Objective isolation

A change scoped to one objective (e.g. Essayer de concevoir) must never silently change another (e.g. Suivre mon cycle, Grossesse, Post-partum). Before modifying any shared component or store, **check every consumer**. If behavior genuinely needs to differ by objective, make the component objective-aware via an explicit prop (the established pattern: optional props with defaults that preserve the original caller's behavior — see how `DailyJournalCard`'s `shortcuts`/`title` props were added without touching `CycleHomeScreen`'s usage). Never hardcode one objective's behavior into a shared component as if it were universal.

## 5. Real data only

Never hardcode fake production values (a cycle day, a fertility status, an ovulation date, a temperature, an LH result, a pregnancy week, a lochia duration, a Nifas status, prayer info, a statistic). Compute from the real store/utility. Mock data is only acceptable when the user explicitly asks for a mock/prototype, and it must be clearly labeled as such in code comments (the existing `StatisticsScreen.tsx`'s hardcoded `PREVIEW_DATA` is a known, already-flagged exception documented in `TODO.md` — treat it as a bug to eventually fix, not a pattern to copy elsewhere).

## 6. Privacy & security

Treat as sensitive: health data, menstrual/fertility/pregnancy/miscarriage/postpartum data, intimate data, private notes/photos, religious-practice data. Respect and never bypass the existing discreet-notification, PIN/biometric, and private-section systems (§3). **Known gap, tracked in `TODO.md`**: intimate/journal *content* is currently plaintext AsyncStorage (only the PIN/biometric secrets themselves are Keychain-protected) — do not present this as "already encrypted," and do not make the gap worse by adding new sensitive fields without the same (lack of) protection being flagged.

## 7. Religious & medical content

Religious content stays educational and neutral across schools of thought where they diverge — never invent a fatwa, a madhhab-specific ruling, or present one school's view as universal. If content needs validation by a scholar/organization, flag it (`[!] RELIGIOUS-CONTENT VALIDATION REQUIRED`, matching `TODO.md`'s convention) rather than inventing an answer. Medical/tracking content stays descriptive, never diagnostic — do not invent unsupported medical claims.

## 8. Responsive design — absolute rule

Every screen must work on Samsung Galaxy A13-class small phones through large phones: use flex layouts, `ScrollView`, `useSafeAreaInsets`, `contentContainerStyle`, and proper `KeyboardAvoidingView` handling. No fixed dimensions that can clip content or hide a CTA below the fold or behind the Android navigation bar.

## 9. Change-scope discipline

When asked to change X, change X. Identify the minimum necessary file set before editing. No drive-by refactors, renames, formatting passes, or dependency changes unless they are strictly necessary for the requested task.

## 10. No unnecessary dependencies

Check `package.json` first. If a new dependency is genuinely required, explain why before adding it — don't install something merely because it's more convenient than what's already available (e.g. `react-native-keychain`, `@notifee/react-native`, `js-sha256`, `react-native-image-picker` already cover most native needs).

## 11. Before starting significant work, verify:

- [ ] I understand the requested objective and which `ObjectiveId` it belongs to.
- [ ] I inspected the closest existing implementation (screen, component, or pattern) as the visual/behavioral reference.
- [ ] I checked whether a relevant store already exists (§3's list).
- [ ] I checked existing navigation routes before adding one.
- [ ] I checked for an existing shared component before creating a new one.
- [ ] I know the real source of any data shown (no fake values).
- [ ] The design matches AWA's existing visual language (§2), not a new one.
- [ ] The implementation is responsive (§8).
- [ ] Privacy is preserved (§6) and other objectives won't regress (§4).
- [ ] I'm not duplicating an existing store/component.
- [ ] I'm not touching unrelated files.

## 12. After implementation, verify and report:

- Run `npx tsc --noEmit` and the project's ESLint command on touched files.
- No unused imports/variables introduced.
- No obvious duplicate state or hardcoded production data.
- No accidental cross-objective regression.
- Report back: what changed, which files, which existing components/stores were reused, whether real data is connected, what validation ran, and anything that still needs testing. Do not hide limitations.

## 13. When to brainstorm vs. act directly

Use the `superpowers:brainstorming` skill (when available) before implementation when the request is a new feature, a new screen family, an architecture or significant UX/data-model change, backend integration, a security change, or complex cross-objective behavior with multiple reasonable approaches. Skip it for trivial changes (a label, an icon, a spacing tweak, a simple TypeScript fix) — inspect the relevant code directly and act. For a deeper, structured pre-implementation or pre-merge review on larger tasks, invoke the `awa-guardian` subagent (`.claude/agents/awa-guardian.md`) — it is opt-in, not automatic.

## 14. `TODO.md` awareness

If `TODO.md` exists at the repo root, consult it for planned-feature/known-gap context (it reflects a point-in-time audit). It never overrides the cahier des charges or an explicit user instruction (§0).
