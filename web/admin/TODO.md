# AWA Admin — Development TODO

**Last audit date:** 2026-09-24 (status re-audit of the FRONTEND against current code — statuses only; no application code was changed)
**Project:** AWA Admin
**Platform:** Next.js 15 (App Router) / React / TypeScript / Tailwind
**Workspace:** `web/admin/`
**Reference TODO:** `D:\HAWA\TODO.md` (root mobile app TODO — this document mirrors its structure/methodology but tracks a separate codebase; the two are not otherwise linked except where explicitly cross-referenced under `CROSS-PROJECT`)
**Source of truth:** full Admin repository audit (code inspection, not assumption) — six parallel deep-dive passes covering every route under `src/app/(admin)/admin/**`, every service in `src/services/`, every mock file in `src/data/mock/`, layout/navigation, auth/security, and cross-cutting engineering quality.

> This document is based on an actual code audit. No feature is marked `[x]` merely because a page/file exists. Mock-backed, local-only, placeholder, or non-persistent behavior is identified explicitly and classified `[~]`. Every verdict below is backed by a real file read with line-level evidence (paths relative to `web/admin/` unless stated otherwise), not inferred from a screen merely existing or from route/file names.
>
> **Headline finding:** AWA Admin is a visually complete, well-architected Next.js App Router application with **zero real backend anywhere**. All 4 service modules (`src/services/{adminOperations,spiritual,subscriptions,users}.ts`) exclusively read/write in-memory mock data from `src/data/mock/`; most mutation paths either silently reset on reload or are hardwired to throw a "no service connected" error. **There is no authentication or authorization enforcement of any kind** — no `middleware.ts` exists, login is a client-side string comparison against a hardcoded demo password, and every `/admin/**` route (including Medical Exports, which surfaces health-adjacent PII) is reachable by typing the URL directly. To the codebase's credit, this is unusually self-honest: most mutating screens display an explicit "Mode démonstration" banner or a capability-flag object (`{ source: 'mock', persistentMutations: false, ... }`) rather than faking success — this pattern should be preserved, not "cleaned up" into false completeness as real backends are wired in.

> **2026-09-24 re-audit note:** the 2026-09-07 text below was stale in several places. Since then the Notifications area, the Configuration area, and two of the four Security screens (Administrateurs, Rôles & permissions) were built as real interactive UIs (session-only, in-memory state via `src/stores/*SessionStore.ts` or local `useState`, nothing persisted and nothing delivered). The spiritual Validations screen gained a working review workflow, and Dashboard period/refresh, Analytics custom range/CSV export, Users dead-code cleanup, and `.env` git-ignoring were also completed. Statuses and short reason notes below were updated accordingly. The headline finding is unchanged: **no backend, no authentication/authorization enforcement, no persistence anywhere.**

## Status legend

- `[x]` Done — real, working implementation found and verified
- `[ ]` Todo — not implemented at all
- `[~]` Partial — implemented but incomplete, inconsistent, mocked, stubbed, or missing persistence/integration
- `[!]` Blocked / dependency — cannot be completed without another system, decision, provider, backend contract, reviewer, or external dependency

## Labels

`FRONTEND` `BACKEND` `SECURITY` `PRIVACY` `MEDICAL` `RELIGIOUS-CONTENT` `PREMIUM` `FREE` `CROSS-PROJECT` `FUTURE`

## Priorities

`P0` critical / security / blocks real Admin usage · `P1` important for a functionally-complete production Admin · `P2` quality/UX/reliability · `P3` polish/optional

---

# 1. FRONTEND

## 1.1 Admin Authentication UI

- [x] Admin login interface (`src/app/admin-login/components/AdminLoginContent.tsx`) — complete visual form (email/password fields, password visibility toggle, responsive two-pane layout with hero image background), a "Se souvenir de moi" checkbox, and a self-contained "Accès de démonstration" panel with one-click credential autofill and copy-to-clipboard. `FRONTEND`
- [~] Login submission — `onSubmit` (lines 69-87, explicitly commented `// Backend integration point: replace with real auth API call`) awaits a fake 1400ms `setTimeout`, then does a plain string comparison of the form fields against `ADMIN_DEMO_CREDENTIALS` (`src/config/admin.ts:10-13` — a hardcoded email + the plaintext demo password `admin123` committed to source). On success it only calls `toast.success(...)` + `router.push(ADMIN_ROUTES.dashboard)`; **no token, cookie, or session artifact is ever written anywhere** (repo-wide grep for `localStorage`/`sessionStorage`/`document.cookie` returns zero matches). `FRONTEND` `BACKEND` `SECURITY` `P0`
- [!] Real authentication against a backend/identity provider — blocked on a backend/IdP and the auth-stack decision (§2.1). Re-verified 2026-09-24: no API call, token, cookie or storage exists. `BACKEND` `SECURITY` `P0`
- [ ] "Se souvenir de moi" is inert — registered via `react-hook-form` (`AdminLoginContent.tsx:~313`) but `rememberMe` is never read in `onSubmit`. `FRONTEND` `P3`
- [~] "Mot de passe oublié ?" — no longer a silent dead control: the button is now `disabled` with a tooltip ("Disponible après connexion du service d'authentification", `AdminLoginContent.tsx:~263-270`), but no forgot-password flow exists. `FRONTEND` `P2`
- [!] Real forgot-password flow (email delivery, reset token, reset form) — needs an email/auth backend. `FRONTEND` `BACKEND` `P2`
- [ ] 2FA — still purely decorative copy ("Connexion sécurisée par 2FA / Une vérification en deux étapes peut être requise", `AdminLoginContent.tsx:~359-364`, wording softened since the last audit); no second factor, code input or verification flow exists. The footer's "Chiffrement de bout en bout" claim is also unsubstantiated. Either build it or remove the claims. `FRONTEND` `BACKEND` `SECURITY` `P1`
- [x] Language switcher — resolved: the "FR" control is now a non-interactive `<span>` titled "AWA Admin est disponible en français uniquement" (`AdminLoginContent.tsx:~162-168`), so it no longer looks like a dead button (French-only by design). `FRONTEND`
- [x] Loading/validation/error states on the login form itself (spinner during the fake submit, field-level validation via `react-hook-form`) — real as far as client-side form mechanics go. `FRONTEND`
- [~] Logout — `Sidebar.tsx:~551-559`'s "Déconnexion" is a `<Link href="/admin-login">`, pure client-side navigation with nothing to actually invalidate (consistent with there being no session to clear). `FRONTEND` `BACKEND` `P0`
- [!] Route protection / redirect-if-unauthenticated — blocked on real authentication/session (above). Re-verified 2026-09-24: no `middleware.ts`/`proxy.ts` anywhere in `web/admin`; `src/app/(admin)/layout.tsx:4-6` renders `AppLayout` unconditionally; `src/app/page.tsx` now redirects `/` to `/admin-login` (not the dashboard), but that gates nothing. **Any `/admin/**` URL loads fully with zero login.** `FRONTEND` `BACKEND` `SECURITY` `P0`

## 1.2 Layout & Navigation

- [x] `AppLayout.tsx`/`Sidebar.tsx`/`Topbar.tsx` — real nested/collapsible navigation with per-item `open` state, active-route highlighting via `usePathname`, mobile responsiveness (backdrop + slide transform), and the recently-integrated `sidebar.png` background layer (verified separately complete and out of scope for this business-logic audit). Nav gap noted 2026-09-24: the Security group lists only Administrateurs and Rôles; "Journaux d'activité" and "Demandes de données" have routes/breadcrumbs but no sidebar entry. `FRONTEND`
- [~] Sidebar collapse state (`sidebarCollapsed`, `AppLayout.tsx:12`) is local `useState` only — resets to expanded on every reload, not persisted. `FRONTEND` `P2`
- [~] Sidebar badges (now 3 badges: users 4, validations 3, support 7 — `Sidebar.tsx:~70,119,214`) are hardcoded static numbers in the `navItems` array, not derived from any store/API. `FRONTEND` `BACKEND` `P2`
- [x] Topbar search — implemented 2026-09-24 as a real, frontend-only global search (`src/components/layout/GlobalSearch.tsx`, `src/lib/globalSearch.ts`), replacing the disabled input in `Topbar.tsx`. Searches Utilisatrices, Articles, Catégories, Plans, Abonnements actifs, Support, Exports médicaux, Notifications, Validations, Articles religieux, Administrateurs and Rôles & permissions (12 groups) — case-insensitive, whitespace-trimmed, grouped results, keyboard navigation (↑/↓/Enter/Escape), click-outside-to-close, and real navigation to each entity's actual existing route (e.g. `/admin/utilisatrices/[id]` for a user). No backend/API involved; verified with `tsc`, `next lint` and `npm run build`, and interactively via Playwright (no console/page errors introduced — see final report). `FRONTEND`
- [~] Topbar notifications bell — still backed by a literal inline `mockNotifications` array (`Topbar.tsx:~64-79`), not connected to `notificationsSessionStore`; the red dot is always shown and the notification items have no handler. "Voir toutes les notifications" is now a real link to the notifications history; the "Aide" item is gone. `FRONTEND` `BACKEND` `P2`
- [x] AWA logo + "Administration" label — preserved correctly, unaffected by the `sidebar.png` background work; logo asset and text unchanged. `FRONTEND`
- [x] Admin/Super Admin footer (avatar, name, role label, logout icon) — real, reads `CURRENT_ADMIN` for display; functionally correct as a display component (the logout link itself is covered under §1.1). `FRONTEND`
- [~] Loading/error boundary coverage is inconsistent across route groups — present for `abonnements`, `analytics`, `exports-medicaux`, `reperes-spirituels`, `support`, `utilisatrices/[id]`; absent for `securite`, `configuration`, `notifications`, `contenus`, the `utilisatrices` list, and the dashboard root (re-verified 2026-09-24; only a global `src/app/not-found.tsx` exists — no global `error.tsx`/`loading.tsx`). `FRONTEND` `P2`

## 1.3 Dashboard

Every metric on `src/app/(admin)/admin/page.tsx` → `DashboardContent.tsx` traces to `src/data/mock/dashboard.ts`, which opens with `// Backend integration point: replace with API calls to /api/dashboard/*` (line 3). Since the last audit the mock also gained period scaling (`getDashboardSnapshot`, `dashboard.ts:~216-279`): a fixed `factor` multiplies the same base numbers per period — it is not real aggregation.

- [~] KPI cards (total users 24,846 / active users 15,920 / premium 4,280 / MRR 18,420€ / new registrations 1,248 / premium rate 17.2%) — real animated count-up UI (`KpiCard.tsx`/`AnimatedCounter.tsx`), still hardcoded values (`dashboard.ts:8-75`); they now change with the selected period, but only via fake scaling (even MRR/total users are multiplied by a factor). `FRONTEND` `BACKEND` `P1`
- [!] "Temps réel" / live data — the misleading "Temps réel" indicator was removed; `DashboardContent.tsx:~115-125` now shows "Mis à jour à HH:MM" and the dot pulses only while refreshing. No polling/WebSocket/`useSWR` exists, and genuinely live metrics need a backend. `FRONTEND` `BACKEND` `P1`
- [~] Period filter (Aujourd'hui/7j/30j/3m/12m) — now wired: `selectedRange` drives `getDashboardSnapshot(range)` (`DashboardContent.tsx:~40-62`), changing KPIs, growth chart, objective distribution and the activity list. But the data is scaled mock, and the Premium-conversion and Country-distribution charts ignore the range. `FRONTEND` `BACKEND` `P1`
- [~] Refresh action — an "Actualiser" button now exists (`DashboardHeader.tsx:~72-81` → `handleRefresh`, `DashboardContent.tsx:~46-53`), but it is a fake 600 ms `setTimeout` that only updates the timestamp; nothing is re-fetched. `FRONTEND` `P2`
- [~] User growth chart — real Recharts `AreaChart` over `mockUserGrowthData` (`dashboard.ts:77-90`, which itself contains a duplicated `'03 sep'` data point, evidence of hand-typed mock data). `FRONTEND` `BACKEND` `P1`
- [~] Objective distribution / Premium conversion / Country distribution charts — `ObjectiveChart.tsx` now takes a `data` prop from the snapshot (but keeps a leftover `defaultObjectiveData` copy, `:12-21`); `PremiumConversionChart.tsx:~15-22` and `CountryDistribution.tsx:~6-13` still hardcode their **own separate copies** of the `dashboard.ts` arrays, take no props and ignore the period — a maintainability defect (data can silently drift) independent of the mock-vs-real question. `FRONTEND` `P3`
- [~] Activity feed — real list over `mockRecentActivity` (`dashboard.ts:112-176`); "Voir tout" now opens a modal with the full mock feed (`DashboardContent.tsx:~233-271`) — the previously dead button is fixed, but the feed itself is still mock data. `FRONTEND` `P2`
- [~] Alerts panel ("À traiter") — real per-alert `href` navigation (`AlertsPanel.tsx:52`, works), but counts are static, not derived from a real queue (`mockAlerts`, `dashboard.ts:178-214`). `FRONTEND` `BACKEND` `P1`
- [x] Quick actions (`QuickActions.tsx:8-41`) — a fully static, hardcoded list of 4 real `next/link` navigation shortcuts; doesn't claim to show live data, so this is genuinely complete for what it is. `FRONTEND`
- [x] Privacy notice at the bottom of the dashboard (`DashboardContent.tsx:220-238`) — static, correctly worded disclaimer text; no logic needed. `FRONTEND`

## 1.4 User Management

- [x] Listing (`src/app/(admin)/admin/utilisatrices/page.tsx` → `src/app/users/components/UsersContent.tsx`) — real, functioning client-side search/filter/sort/pagination and CSV export (genuine Blob + anchor-click download); real inline SVG country-flag art. `FRONTEND`
- [~] The listing reads `mockUsers` directly (`useState(() => mockUsers.map(...))`, `UsersContent.tsx:~421`), **bypassing `services/users.ts` entirely** — a second, inconsistent path to the same mock data versus the detail page's use of the service layer. `FRONTEND` `P2`
- [x] User details page (`src/app/(admin)/admin/utilisatrices/[id]/page.tsx`) renders the selected user's dynamic `[id]` and resolves it via a real service call (`getUserById(id)`, `services/users.ts:85-98`), including a genuine 404 (`not-found.tsx`) for an unknown id — not decorative. `loading.tsx`/`error.tsx`/`not-found.tsx` all exist and are correctly wired. `FRONTEND`
- [x] Detail tabs (overview/account/objective/subscription/preferences/devices/data/activity) are real and driven by `USER_DETAIL_TABS`; `objectiveHistory`/`devices`/`dataRequests`/`adminActivity` are **honestly empty** (`getUserById` hardcodes them to `[]`) and rendered via an explicit `HonestEmptyState` rather than fabricated data — good practice, not a bug. `FRONTEND` `!` `BACKEND`
- [~] Suspend / Disable / Reactivate / Delete / Edit — `UserActionDialog.tsx`'s `submit()` calls `mutateUser()` (`services/users.ts:~97-99`), which **unconditionally `throw new UserMutationUnavailableError()`** for every action type. The dialog is honest about this (toast error + inline "nothing is modified" warning), it does not fake success. The dialog/confirmation UI is real and complete (split below); the underlying action is blocked on a backend.
  - [x] Suspension/disable/reactivate/delete/edit dialog and confirmation UI — real validation (suspend requires a reason, delete requires typing "SUPPRIMER", edit requires a name), Escape handling, wired from the detail page and from the list row menu via `?action=` deep links. `FRONTEND`
  - [!] Suspension/disable/reactivate/delete/edit action currently always throws (no mock mutation, no persistence of any kind) — blocked on a Users mutation backend (§2.3). `FRONTEND` `BACKEND` `P1`
- [x] Legacy/dead code — resolved: the old inline modal system (`ModalState`, `EditUserForm`, `applyConfirmation`/`saveUser`) no longer exists in `UsersContent.tsx` (re-verified 2026-09-24; file is now ~1038 lines and the row menu uses `router.push`). `FRONTEND`

## 1.5 Subscription Management

- [~] Overview (`SubscriptionsOverview.tsx`) — renders fully and switches periods, but KPIs/charts are 100% mock: the period selector swaps between a **second, independently hardcoded lookup table** (`SubscriptionsOverview.tsx:35-63`) rather than recomputing anything; chart "loading" is a fake `window.setTimeout(..., 180)` (`:69-73`); no `DemoNotice` on this page. `FRONTEND` `BACKEND` `P1`
- [x] Active subscriptions list — real search, plan/country/status filters, tabs, pagination and CSV export over 15 mock rows (there are no sortable column headers — filters only); "Voir l'utilisatrice" correctly cross-links to the real user detail page. `FRONTEND`
- [~] Active subscription "Modifier"/"Annuler" — genuinely mutate local React state (`setSubscriptions`, `ActiveSubscriptionsContent.tsx:~336-379`, better than the Users no-op) but never persist beyond the page session; a reload reverts everything. Success toasts ("Abonnement mis à jour avec succès." / "Abonnement annulé — motif enregistré.") are misleading: there is no `DemoNotice`, the cancel reason is discarded, and edits/cancellations never reach the history page. `FRONTEND` `BACKEND` `P1`
- [x] Active subscriptions tab counts — fixed: now computed from the data (`tabCounts`, `ActiveSubscriptionsContent.tsx:~94-101`) instead of hardcoded `4280`/`3438`/`842`. Remaining hardcoding lives in the mock (`subscriberCount` 20566/3438/842 in `subscriptions.ts`, a distribution chart that doesn't match those counts, overview KPI 4280). `FRONTEND`
- [x] Subscription history — real, functional read-only list with filter/date-range/search/pagination/detail modal/CSV export over mock data; no mutation surface (and it does not receive events from the edit/cancel actions), so nothing is missing except the real data source. `FRONTEND`
- [x] Plan model matches the real AWA product exactly — confirmed exact names in `src/data/mock/subscriptions.ts:10-74` and the `planName` type union (`src/types/subscriptions.ts:77,98`) are **"Gratuit" / "Premium Mensuel" / "Premium Annuel"** only. No invented plan (e.g. "Premium à vie") exists anywhere in the codebase — verified by direct read. `FRONTEND`
- [~] Plans CRUD (create/edit/duplicate/toggle-active) — real, validated react-hook-form dialogs (regex-validated codes, numeric fields), explicitly and honestly labeled session-only (`DemoNotice`); `persistPlan()`/`duplicatePlan()` only touch local React state after a fake 250ms delay. Also has an entitlements editor, a duplicate-code check, unique-code generation on duplicate and a price-change confirmation when subscribers exist; there is no delete. `FRONTEND` `BACKEND` `P1`
- [~] Country pricing CRUD (create/edit/duplicate/toggle-active/delete) — same profile as Plans (duplicate-country check, `DemoNotice`); delete is correctly guarded against rows with billing data — all 6 seeded rows have `hasBillingData: true` so they cannot be deleted, but newly created/duplicated rows are deletable. Regional revenue breakdown is 100% hardcoded, not derived from pricing/subscription data. `FRONTEND` `BACKEND` `P1`
- [!] Payment/IAP provider integration (Stripe/RevenueCat/App Store/Play Billing) — confirmed via broad grep: zero SDK/API code anywhere; only a descriptive `subscriptionProvider?: 'apple'|'google'|'stripe'` label field used for mock-data display. Mirrors the mobile app's own documented "no purchase SDK installed" state. `BACKEND` `CROSS-PROJECT` `!` blocked on the mobile app's own Phase 6 purchase-SDK work landing first (see root `TODO.md` §5 Phase 6).

## 1.6 Content Management

All four screens (`src/app/content/components/{ArticlesContent,CategoriesContent,MediaContent,PremiumContent}.tsx`, the real implementation behind `/admin/contenus/*`) are seeded from `src/data/mock/content.ts`, with no service layer (`src/services/content.ts` does not exist) and no `/api/*` route anywhere. Articles now use a shared in-memory session store (`src/stores/contentArticlesSessionStore.ts`, so Categories' article counts reflect Articles edits within a session); Media, Categories and Premium still seed local `useState`. Every mutating screen displays an explicit `DemoNotice`: *"Mode démonstration — les modifications sont conservées uniquement pendant cette session."* Nothing survives a reload.

- [~] Articles CRUD — create/edit/delete/publish-toggle/feature/duplicate all mutate session state only (shared session store, `ArticlesContent.tsx:~462-530`); search/filter/sort/pagination, multi-select bulk publish/archive/delete and a detail preview are real and functional. `FRONTEND` `BACKEND` `P1`
- [~] Categories CRUD — same pattern; delete is correctly blocked when `articleCount > 0` (a real, sensible guard) but otherwise session-only. `FRONTEND` `BACKEND` `P1`
- [~] Media library/upload — real client-side validation (extension/MIME whitelist, 25MB cap), replace/rename/delete/download/copy-URL actions, but the "upload" itself is `URL.createObjectURL(file)` (`MediaContent.tsx:~126`) — a browser-local blob URL, not real storage; the asset and its "download"/"copy URL" actions die on reload. `FRONTEND` `BACKEND` `P1`
- [~] Premium content flagging CRUD — same session-only local-state pattern as Articles/Categories. `FRONTEND` `BACKEND` `P1`
- [x] Search/filter/sort/pagination across all four screens — real, working client-side logic (spot-checked in Articles, Media and Premium; Categories not inspected in depth); reusable once real data replaces the mock arrays underneath. `FRONTEND`

## 1.7 Spiritual / Religious Content

The real implementation behind `/admin/reperes-spirituels/*` lives in `src/app/spiritual/components/{ReligiousArticlesContent,FeatureControlContent,ValidationsContent,SpiritualUI}.tsx`. `src/services/spiritual.ts`'s two mutation functions are **hardwired to always throw** (`saveSpiritualConfiguration`/`mutateSpiritualContent`, lines 64-72), and `spiritualCapabilities` (lines 74-82) self-declares `persistentSettings: false, contentMutations: false, reviewWorkflow: false, reviewerDirectory: false, auditLogging: false, officialHijriSynchronization: false`. Every screen shows an honest `BackendNotice`. (Re-verified 2026-09-24: the two throwing service functions and the all-`false` capability object are unchanged, but `spiritualCapabilities` is exported and never imported, and its `reviewWorkflow`/`reviewerDirectory`/`auditLogging: false` flags now contradict the session-only review workflow on the Validations screen.)

- [~] Religious articles CRUD — the list, filters, tabs, view modal and edit form work, but every write action (edit-submit/duplicate/submit-review/publish-toggle/archive/delete) routes through a helper that always throws (`ReligiousArticlesContent.tsx:~72-79,243-250`) and shows a `toast.error`; nothing mutates, not even local state — this doesn't fake success, unlike Content Management (§1.6). The list is a snapshot of only 1 seeded religious article and never reflects edits made in Contenus → Articles; "publish" is disabled unless `validationStatus === 'validated'`, which nothing can set. Write path blocked on a backend (§2.6). `FRONTEND` `BACKEND` `P1`
- [!] Hijri calendar "configuration" — settings panel lets an admin toggle values in local state, but save always throws, and the UI itself explicitly states *"Aucun moteur de conversion Hijri n'est connecté à ce projet administratif"* (`FeatureControlContent.tsx:~381-384`); the overview shows "Non disponible" for the Hijri date. There is no engine to incrementally fix — needs a real calendar computation/config engine from scratch. `FRONTEND` `BACKEND` `!` product/architecture decision required on which conversion method to adopt — the mobile app already has ICU-based Hijri conversion (`hijriCalendar.ts`, root `TODO.md` §1.16); check for reuse before building a second engine. `CROSS-PROJECT`
- [~] Nifas management panel — same `FeatureControlContent` pattern; renders overview/tabs with honest empty states, but reminders/history/events source from **hardcoded empty mock arrays** (`mockSpiritualReminders`/`mockSpiritualHistory`/`mockSpiritualEvents = []`, `src/data/mock/spiritual.ts:~158-160`; the only seeded configuration is `nifasReferenceDays: 40`), so panels render empty; save always throws. `FRONTEND` `BACKEND` `P1`
- [~] Ramadan/Qadaa management panel — identical pattern to Nifas above (overview shows "Prochaine période: Non calculée"). `FRONTEND` `BACKEND` `P1`
- [~] **Validation workflow (`/admin/reperes-spirituels/validations`)** — no longer missing: `mockSpiritualValidations` now holds 6 seeded records (pending/in_review/validated/rejected/changes_requested, religious and medical); the row menu offers "Voir les détails" and "Examiner", which opens a `ReviewDialog` requiring a reviewer chosen from active administrators with an eligible role (via `useSecuritySession`), with approve/reject (a reason is required to reject), a `version + 1` bump and a per-record decision history (`ValidationsContent.tsx:~143-362`). **Still not traceable/real**: state is `useState` only (lost on reload), decisions don't propagate to the article's `validationStatus`, validation `articleId`s don't match mock article ids, there is no "changes requested" action, no audit log is written (`auditLogging: false`), and the `BackendNotice` still shows. Per `CLAUDE.md` §7, no status may be presented as final without real, persisted, traceable sign-off. `FRONTEND` `BACKEND` `RELIGIOUS-CONTENT` `P0` — flagged P0 rather than P1 because presenting any religious-content status as "validated" without real traceability is a direct `CLAUDE.md` §7 violation risk; the UI/workflow prerequisites now exist, persistence and audit do not.
- [~] Legacy route trees (`/content/*`, `/spiritual/*`) — only partly "harmless": every `page.tsx` there is a pure `redirect()` stub, but the trees also hold the **shared implementation** (`/admin/contenus/*` and `/admin/reperes-spirituels/*` import their screens from `src/app/content/components/*` and `src/app/spiritual/components/*`), plus a separate `src/app/spiritual/{layout,error,loading}.tsx`, and many other admin screens (configuration, notifications, security, operations, dashboard) import shared UI (`Modal`, `ConfirmDialog`, `DemoNotice`, …) from `src/app/content/components/ContentUI`. Not a duplicate implementation, but misleading paths — a maintainability smell rather than a bug. `FRONTEND` `P3`

## 1.8 Notifications

- [~] **Notifications area — no longer a placeholder, but nothing is delivered.** `notifications/page.tsx` redirects to `nouvelle`; `nouvelle`, `programmees` and `historique` now render real components (`NewNotificationContent`, `ScheduledNotificationsContent`, `NotificationHistoryContent`) over `data/mock/notifications.ts` and an in-memory `notificationsSessionStore` (module singleton — survives client navigation, lost on reload). Honestly labelled as simulated ("Envoi simulé — aucune notification réelle…", `DemoNotice`). No `loading.tsx`/`error.tsx` for this route group. `FRONTEND` `P1`
- [~] Audience selection / segmentation logic — a single-select audience dropdown with preview (all / free / premium / one per objective; `AUDIENCE_OPTIONS`, `mock/notifications.ts:~33-42`, estimated counts from mock data). No multi-criteria/combined segmentation, no country/activity filter, no real user resolution. `FRONTEND` `BACKEND` `P1`
- [~] Send now / scheduling / edit-scheduled / cancel — compose with validation, save draft, schedule, "Envoyer maintenant (simulation)", and (scheduled page) search/filter/pagination/view/edit/duplicate/cancel with confirmation all work in-session. Fake/missing: "send" just flips status to `sent` and fabricates `deliveredCount`/`openedCount` (an invented 42% open rate); nothing ever transitions a scheduled campaign at its scheduled time; past schedule dates aren't rejected; deep links aren't validated; `deleteCampaign` is never used. `FRONTEND` `BACKEND` `P1`
- [~] Delivery-status history, retry/error UI — the history page has search, status/period filters, pagination and a details modal, but shows seeded/fabricated delivery and open-rate numbers; there is no `failed` status, retry or error UI (`NotificationStatus` is only `draft | scheduled | sent | cancelled`). `FRONTEND` `BACKEND` `P1`
- [!] Push provider integration — repo-wide grep confirms zero matches for `notifee`/`FCM`/`firebase`/`expo-notifications`; the mobile app uses `@notifee/react-native` **locally only**, so there is no server-push infrastructure anywhere in this repo to integrate with yet. `BACKEND` `CROSS-PROJECT` `!` blocked on a server-push backend that doesn't exist for either project today.

## 1.9 Medical Exports

- [x] Export request list/filter/sort/pagination/KPI cards/distribution chart — real, well-built UI shell over mock data (`MedicalExportsContent.tsx`). `FRONTEND`
- [~] Create/cancel/delete/retry export request — real interactive UI, but each action (`MedicalExportsContent.tsx:~336-366,579-593,671-698`) is a fake ~450ms delay followed by `setRequests(...)` local-state mutation only; nothing persists past the session (`persistentMutations: false`). Create has react-hook-form validation (incl. custom-range end ≥ start); "Retry" only flips the row to "processing" and never completes (cosmetic). `FRONTEND` `BACKEND` `P1`
- [~] File download — a "Télécharger" action now exists for `completed` rows (`MedicalExportsContent.tsx:~566-576`) but it only fires `toast.info('Le fichier sera disponible lorsque le service d'export sera connecté.')`; no file (real or fake) is generated, `adminOperationsCapabilities.medicalExportDownload` is still `false`. Real generation needs the secure export backend (§2.8). `FRONTEND` `BACKEND` `P1`
- [!] **No authorization gate of any kind exists on this route** — re-verified 2026-09-24: `exports-medicaux/page.tsx` just fetches and renders, `(admin)/layout.tsx` has no auth check, no middleware exists, and the Security screens (Administrateurs / Rôles & permissions) enforce nothing anywhere. Real user names/emails (mock, but the pattern would carry to production) render with zero access check. Blocked on real authentication + RBAC enforcement; given this screen's sole purpose is exporting sensitive health-adjacent data, this remains the single most severe finding in the entire audit. `SECURITY` `MEDICAL` `PRIVACY` `P0`
- [!] No audit trail — `requestedBy: 'Admin'` is hardcoded (`MedicalExportsContent.tsx:~361`), not a persisted, tamper-evident log of who requested/viewed/downloaded an export; the audit-log screen (`journaux-activite`) is still a placeholder and no action writes any log. Needs a persisted audit backend and must be built at the same time as the real download feature, not after. `BACKEND` `SECURITY` `MEDICAL` `P0`
- [~] Privacy messaging — `DemoNotice` shown, and a note in the component states files are "only available once the secure generation service is connected" — honest, but doesn't substitute for actual access control. `FRONTEND`
- [~] Lint: `MedicalExportsContent.tsx:8:3` — `'Plus'` imported but unused (the only occurrence in the file is the import line), re-verified 2026-09-24 (`npm run lint`). `FRONTEND` `P3`

## 1.10 Support

- [x] Ticket list/search/filter/sort/pagination — real, well-built client-side logic (`SupportContent.tsx`) over 18 synthetic mock tickets. `FRONTEND`
- [~] Status change / priority change / assignment — `updateTicket` (`SupportContent.tsx:~424-425`) mutates local state only, no API call, resets on reload. Assignment is self-assign only ("M'assigner" hardcodes `assignedTo: 'Admin'`, no agent picker). `FRONTEND` `BACKEND` `P1`
- [~] Reply / internal note — `sendReply` (lines ~174-202) does a fake 350ms delay then appends to local state (with an internal-note toggle; a reply auto-moves a `new` ticket to in_progress and self-assigns it); **no notification-to-user integration of any kind** exists. `FRONTEND` `BACKEND` `P1`
- [~] Close/reopen, create-ticket-on-behalf-of-user — fully wired in the UI but local-state-only: Close goes through a `ConfirmDialog`; "reopen" is only possible via the status select (no dedicated button, and the reply box is hidden while closed); `CreateSupportModal` validates and `createTicket` appends locally. `FRONTEND` `BACKEND` `P1`
- [x] Demo labeling (`DemoNotice`) — correctly present, doesn't misrepresent the screen as connected. `FRONTEND`

## 1.11 Analytics

- [~] Period filter (7j/30j/3m/6m/12m/Personnalisé) — genuinely functional at the UI level (`AnalyticsContent.tsx:33,38` really swaps the whole dataset), but every period's numbers derive from the same base constants as the Dashboard, scaled by a hardcoded `factor`/`trend` per period (`src/data/mock/adminOperations.ts:265-329`) — not independent real aggregations. `FRONTEND` `BACKEND` `P1`
- [~] Custom date range — now functional at the UI level: `buildCustomAnalyticsDataset(start, end)` (`data/mock/adminOperations.ts:~457-479`) derives a day-count factor/trend, a "Du X au Y (N j.)" label and chart x-axis labels from the chosen dates; inputs have `min`/`max` and a `role="alert"` error when start > end (`AnalyticsContent.tsx:~37-50`). It is still a deterministic scaling of the same mock base numbers (`dayCount/30`), not a real query. `FRONTEND` `BACKEND` `P1`
- [x] Content table sort (views/completion, asc/desc) — genuinely functional client-side `Array.sort` via `useMemo`, real interaction over mock data (other tables, e.g. countries, are not sortable). `FRONTEND`
- [~] Export/download — an "Exporter" button now exists (`AnalyticsContent.tsx:~114-141`) that builds rows from the current dataset and calls the shared `downloadCsv` helper (real Blob CSV, BOM, `;` delimiter, filename `awa-analytics-<period>-YYYY-MM.csv`). It exports only the KPIs and top-content list (no charts/engagement/countries), and the numbers are mock-derived. `FRONTEND` `BACKEND` `P1`
- [~] `loading.tsx`/`error.tsx` are architecturally correct (real Suspense/error-boundary files, non-trivial skeleton/error components) but practically unreachable today since `getAnalyticsDatasets()` is a synchronous `structuredClone()` with no real I/O or failure mode. Will "activate" naturally once a real, slower, fallible fetch replaces the mock clone — no separate fix needed now. `FRONTEND`

## 1.12 Configuration

- [~] All four sub-pages (`feature-flags`, `objectifs`, `parametres-globaux`, `themes`) are now real interactive UIs (no longer placeholders), all local-`useState` only (`data/configuration.ts` mock seeds; state resets even on plain client-side navigation, because there is no session store). `configuration/page.tsx` itself is still a `redirect()` to `objectifs`. Per page:
  - Objectifs — search, add/edit modal with duplicate-name validation, activate/deactivate, move up/down reordering; no delete.
  - Feature flags — search, category tabs with counts, per-flag toggle (`SessionNotice`: preview only); no create/delete.
  - Thèmes — search, edit (name/description/enabled), toggle; the default "AWA Original" theme can't be disabled; no create/delete and the palette isn't editable.
  - Paramètres globaux — only `appName`/`description` editable (required-field validation, dirty guard, reset with confirmation); save is a fake 350 ms `setTimeout` then a "for this session" toast; version/language/timezone/date format are read-only.
  `FRONTEND` `P2`
- [~] `FeatureFlag` TypeScript interface (`src/types/index.ts:227-236`) is still completely unused — the real model is now a different type, `AdminFeatureFlag` (`data/configuration.ts:~127-140`, seeded by `INITIAL_FEATURE_FLAGS`) — so a dead, duplicate interface remains (it models `environment`/`rolloutPercent`/`updatedBy`, which the UI does not). `FRONTEND` `P3`
- [~] Mock persistence layer for Configuration — the business UI is built, but there is no persistence layer at all (not even a session store), and **nothing consumes the configuration**: `data/configuration.ts` is imported only by the four Configuration components, so flags/objectives/themes/settings affect no other admin screen. `FRONTEND` `BACKEND` `P2`

## 1.13 Security Administration

- [~] Security administration — 2 of the 4 routes are built (session-only), 2 are still placeholders (split below). Uses the in-memory `securitySessionStore` (module singleton, seeded from `data/security.ts`; lost on reload). `FRONTEND` `P0`
  - [~] `administrateurs` — real UI: search, role/status filters, pagination, details modal, add/edit form (email validation, duplicate-email check), enable/disable, delete with confirmation, and guards against deleting/disabling/demoting the last active Super Admin; seeded with 7 admins, `DemoNotice`. No password/invitation/email flow (the form says so), the 2FA checkbox is only a stored boolean, and the current admin can delete/disable themselves unless they're the last super admin. Nothing persists or is enforced. `FRONTEND` `BACKEND` `SECURITY` `P0`
  - [~] `roles-permissions` — real UI: list with search/pagination and per-role admin counts, create/edit modal with a grouped permission matrix (28 permission keys in 9 groups) and per-group select-all, uniqueness/at-least-one-permission validation, duplicate (created inactive), activate/deactivate and delete guards (system roles, assigned roles, Super Admin protected). Purely a display/editing model — it enforces nothing anywhere (visual-only RBAC). `FRONTEND` `BACKEND` `SECURITY` `P0`
  - [ ] `journaux-activite` — still an `AdminRouteNotice` placeholder (`securite/journaux-activite/page.tsx`); no audit-log data of any kind (mock or real), no store, and no action anywhere in the admin writes a log; the `AuditLog` type (`types/index.ts:271`) is unused. `FRONTEND` `P0`
  - [ ] `demandes-donnees` — still an `AdminRouteNotice` placeholder (`securite/demandes-donnees/page.tsx`); no data-request (GDPR-style) workflow, statuses or data type exists. `FRONTEND` `PRIVACY` `P1`
- [ ] `CURRENT_ADMIN.role` (`'super_admin'`) is defined but **never once compared or branched on anywhere in the codebase** — re-verified 2026-09-24: no route guard, nav gating, `can()`/`hasPermission` helper or middleware exists, and the permission keys in `data/security.ts` are read by nothing outside the two Security screens. The permissions matrix UI now exists but enforces nothing. The only consumer of roles/administrators outside Security is the Validations reviewer dropdown (`app/spiritual/components/ValidationsContent.tsx:~293-322`), which filters reviewers by role — data filtering, not authorization. `FRONTEND` `BACKEND` `SECURITY` `P0`

## 1.14 Error / Loading / Empty States

- [x] `loading.tsx`/`error.tsx` pairs exist and are correctly wired for `abonnements`, `analytics`, `exports-medicaux`, `reperes-spirituels`, `support`; `utilisatrices/[id]` additionally has a real `not-found.tsx` that genuinely triggers for an unknown user id; a global `src/app/not-found.tsx` also exists. `FRONTEND`
- [ ] No `loading.tsx`/`error.tsx` exist for `configuration/*`, `contenus/*`, `notifications/*`, `securite/*`, the `utilisatrices` list, or the dashboard root (`admin/page.tsx`), and there is no global `error.tsx`/`global-error.tsx`/`loading.tsx` — still true on 2026-09-24. These areas are no longer unbuilt placeholders (notifications/configuration/security screens now exist), so they are already user-facing; boundaries matter more once real async data fetching exists there. `FRONTEND` `P2`
- [~] Where boundaries do exist, they are largely **unreachable in practice today** — the mock service calls behind them resolve synchronously with no real latency or failure mode, so `loading.tsx` rarely renders and `error.tsx` can only fire from an unrelated bug. This is expected and will resolve itself once real (slower, fallible) API calls replace the mock clones. `FRONTEND`

## 1.15 Responsive Design

- [x] Sidebar collapse/expand and mobile drawer behavior — real, functioning, unaffected by the `sidebar.png` background integration. `FRONTEND`
- [~] Data tables (e.g. `app/users/components/UsersContent.tsx:~746`, `min-w-[1420px]`; also Articles 1180px, Premium 1000px, ReligiousArticles 1150px, Validations 1050px, MedicalExports 1120px, Support 1020px, ActiveSubscriptions 1040px, History 1010px) all rely on `overflow-x-auto` horizontal scroll with hardcoded column widths rather than truly fluid columns — acceptable on tablet/laptop, not ideal on a narrow phone-width session (an unlikely usage pattern for an admin tool, but noted). `FRONTEND` `P2`
- [x] Sampled components otherwise show consistent `sm:`/`lg:`/`xl:` breakpoint usage (`UsersContent.tsx`, `SubscriptionsOverview.tsx`); no egregious fixed-width containers that clip content were found in the sampled files. `FRONTEND`

## 1.16 Accessibility

- [~] Sparse but not absent — re-counted 2026-09-24: ~97 `aria-*` occurrences across 34 files, 26 `role=` occurrences across 17 files, 6 `sr-only`, and only 4 uses of `prefers-reduced-motion`/`motion-reduce`/`focus-visible`; no `aria-sort`/`scope="col"` on sortable tables. `FRONTEND` `P2`
- [~] Current ESLint a11y warnings: exactly 2 (re-verified via `npm run lint`), both `jsx-a11y/alt-text` in `src/components/ui/AppImage.tsx:115,127` — arguably false positives since `AppImage.tsx` declares `alt: string` as a **required** prop always forwarded via spread, but static lint analysis can't see through the spread to confirm presence at each call site. `FRONTEND` `P2`
- [ ] No broader accessibility audit (keyboard navigation, focus states, screen-reader flow, contrast ratios, reduced motion) has been performed — sampled modals (`Modal`/`ConfirmDialog` in `app/content/components/ContentUI.tsx`, `SpiritualUI.tsx`, `UserActionDialog.tsx`) do close on Escape/backdrop, focus the close button on mount and set `role="dialog"`/`aria-modal`, but there is no focus trap, no focus restore, no `aria-labelledby`, and the mount effect depends on `[onClose]` so parent re-renders can pull focus back — do not claim WCAG compliance; this line item covers only the two concrete lint warnings above, a real pass is separate, larger work. `FRONTEND` `P2`

---

# 2. BACKEND

**Verdict up front: this project currently has NO backend of any kind — confirmed by direct audit, not assumption.** All 4 service modules (`src/services/{adminOperations,spiritual,subscriptions,users}.ts`) exclusively import from `src/data/mock/*`. A repo-wide grep for `fetch(`/`axios`/`XMLHttpRequest` across `src/` returns **zero matches**. There is no HTTP client dependency in `package.json` (no `axios`, no `@tanstack/react-query`, no `swr`, no `@supabase/supabase-js` despite unused placeholder Supabase env vars in `.env`). No `src/app/api/**` directory exists. Every item below is therefore genuinely **from-scratch** work, mirroring the same "nothing exists yet" reality the root mobile `TODO.md` documents for its own backend (§2 there).

## 2.1 Admin Authentication & Sessions

- [ ] Real Admin login endpoint. `BACKEND` `SECURITY` `P0`
- [ ] Secure session/token lifecycle (issue, refresh, expire, revoke on logout). `BACKEND` `SECURITY` `P0`
- [ ] Password reset backend flow (matches the frontend's currently-dead "Mot de passe oublié ?" button, §1.1). `BACKEND` `P2`
- [ ] 2FA verification backend (matches the frontend's currently-decorative 2FA copy, §1.1). `BACKEND` `SECURITY` `P1`
- [ ] Admin account model (beyond the single hardcoded `CURRENT_ADMIN` constant in `src/config/admin.ts`; a seeded 7-admin list now exists in `src/data/security.ts` / `securitySessionStore` as session-only mock, unrelated to login). `BACKEND` `P0`
- [!] Architectural decision required: choice of auth provider/stack (e.g. NextAuth + a real IdP vs. a custom backend session) before any of the above can be implemented. `BACKEND` `!`

## 2.2 Authorization / RBAC

- [ ] Real role/permission model with actual enforcement points — today `CURRENT_ADMIN.role` is defined but never once branched on anywhere in the codebase; a session-only roles/permissions editor now exists (`/admin/securite/roles-permissions`, §1.13) but it is display/edit only and enforces nothing. `BACKEND` `SECURITY` `P0`
- [ ] Route/API-level enforcement (once real routes/APIs exist) — frontend-only visibility rules must never be treated as real authorization. `BACKEND` `SECURITY` `P0`
- [ ] Super-admin-only restrictions on privileged actions (medical exports, admin management, security settings). `BACKEND` `SECURITY` `P0`

## 2.3 Users API

- [ ] List/detail/search/filter/paginate — frontend already models this shape correctly (`ManagedUser`, `services/users.ts`); needs a real backend behind `listUsers()`/`getUserById()`. `BACKEND` `P1`
- [ ] Update/suspend/reactivate/deactivate/delete — the frontend seam (`mutateUser()`, `services/users.ts:100-102`) already exists and is called correctly by `UserActionDialog.tsx`; it currently just always throws. This is the cleanest "swap the stub for a real implementation" seam in the whole codebase. `BACKEND` `P1`
- [ ] Subscription lookup per user, device sessions, data-privacy requests, admin-activity audit trail — `getUserById` currently hardcodes all of these to `[]`, rendered honestly as empty rather than fabricated. `BACKEND` `P2`

## 2.4 Subscription API

- [ ] List active subscriptions / history / current plan per user. `BACKEND` `P1`
- [ ] Plan management (CRUD) persistence — frontend dialogs are fully built and validated (§1.5), only the write path is missing. `BACKEND` `P1`
- [ ] Country pricing persistence, real regional revenue aggregation (not the current hardcoded array). `BACKEND` `P1`
- [!] Payment/billing provider integration (Stripe/RevenueCat/App Store/Play Billing) — confirmed zero SDK/API code exists. `BACKEND` `CROSS-PROJECT` `!` blocked on the mobile app's own purchase-SDK decision (root `TODO.md` §2.19/§5 Phase 6).
- [!] Webhooks for billing status changes, once a provider is chosen. `BACKEND` `!`

## 2.5 Content / CMS API

- [ ] Articles CRUD, categories CRUD, publish/unpublish state, premium/free flagging — all frontend-ready (§1.6), zero backend exists. `BACKEND` `P1`
- [ ] Real media upload/object storage (e.g. S3/Supabase Storage) replacing the current `URL.createObjectURL` blob-URL approach. `BACKEND` `P1`
- [!] Versioning — not modeled anywhere today; decide if/when needed, don't build speculatively. `BACKEND` `!` product decision required.

## 2.6 Religious Content Validation API

- [ ] Reviewer/scholar account model — `spiritualCapabilities.reviewerDirectory: false` today; nothing exists. `BACKEND` `RELIGIOUS-CONTENT` `P0`
- [ ] Real approve/reject action writing `reviewer` + `status` + a timestamp, with persisted history — the `SpiritualValidationRecord` type already anticipates this shape (`src/types/spiritual.ts:35-50`); nothing persists it today — the Validations screen (§1.7) now has session-only approve/reject buttons, a reviewer picker and decision history, but nothing is written to a backend. `BACKEND` `RELIGIOUS-CONTENT` `P0`
- [ ] Review comments, source/reference traceability, version history for religious articles. `BACKEND` `RELIGIOUS-CONTENT` `P1`
- [!] Per `CLAUDE.md` §7 and the root mobile `TODO.md`'s own convention: no validation status should ever be presented as final without actual scholar/organization sign-off — this is a product/business dependency on top of the engineering work above, not a substitute for it. `RELIGIOUS-CONTENT` `!`

## 2.7 Notifications Backend

- [ ] Push provider integration — none exists for either this admin or the mobile app (which is local-notification-only via `@notifee/react-native`). `BACKEND` `CROSS-PROJECT` `P1`
- [ ] Campaign/audience targeting, scheduling persistence, delivery tracking, failure tracking/retries, history — the frontend for compose/schedule/history/audience selection now exists as a session-only, simulated UI (§1.8); no backend behind it. `BACKEND` `P1`

## 2.8 Medical Exports Backend

- [ ] Secure file generation (real CSV/PDF, replacing the currently-nonexistent download action). `BACKEND` `MEDICAL` `P1`
- [ ] User authorization + admin authorization checks specifically before any export action — the current total absence of any auth anywhere makes this doubly urgent here. `BACKEND` `SECURITY` `MEDICAL` `P0`
- [ ] Temporary/expiring signed download URLs. `BACKEND` `SECURITY` `MEDICAL` `P1`
- [ ] Persisted, admin-attributed audit trail (who requested/viewed/downloaded, when) — must ship alongside the download feature itself, not after. `BACKEND` `SECURITY` `MEDICAL` `P0`

## 2.9 Support Backend

- [ ] Ticket/message persistence, status/priority/assignment mutation endpoints. `BACKEND` `P1`
- [ ] Outbound notification (email/push) to the user when an admin replies — confirmed absent today. `BACKEND` `P1`

## 2.10 Analytics Backend

- [ ] Real per-period KPI/MRR/active-user/registration/premium-conversion aggregation, replacing the current formulaically-scaled mock dataset (`buildAnalyticsDataset()`, `src/data/mock/adminOperations.ts:265-329`). `BACKEND` `P1`
- [ ] Real objective/country distribution aggregation. `BACKEND` `P1`
- [ ] Real custom-date-range query support (today's date pickers have zero effect on returned data). `BACKEND` `P1`
- [!] Historical aggregation storage/strategy — decide local-computation-on-read vs. precomputed rollups once real data volume is known. `BACKEND` `!` architectural decision required.

## 2.11 Configuration Backend

- [ ] Feature-flag persistence and rollout mechanism — a session-only Feature-flags UI + mock (`AdminFeatureFlag`, `data/configuration.ts`) now exists (§1.12), while the original `FeatureFlag` type (`src/types/index.ts:227-236`) is still unused; there is still no service and no persistence. `BACKEND` `P2`
- [ ] Global settings, objective configuration, theme/config persistence — the four Configuration UIs exist (§1.12) but persist nothing. `BACKEND` `P2`
- [!] Mobile-app consumption of any of the above (e.g. a feature flag actually changing mobile behavior) — there is now mock configuration data, but no channel between Admin and the mobile app, and nothing consumes it on either side. `BACKEND` `CROSS-PROJECT` `!`

## 2.12 Security / Audit Backend

- [ ] Admin action logs / activity logs — `/admin/securite/journaux-activite` is a pure placeholder with no data source at all, mock or real. `BACKEND` `SECURITY` `P0`
- [ ] Personal data / privacy requests (GDPR-style) workflow — `/admin/securite/demandes-donnees` is a pure placeholder. `BACKEND` `PRIVACY` `P1`
- [ ] Immutable history for sensitive actions (medical export access, user account mutations, content/religious-validation changes) — none of these are logged anywhere today, not even in mock form. `BACKEND` `SECURITY` `P0`

## 2.13 Database

No real database, ORM, or schema exists anywhere in this repository — confirmed by direct inspection, not assumed. Documenting what a real model would need to cover (do not invent an actual schema without a product/architecture decision first):

- [!] Administrators (accounts, roles, permissions). `BACKEND` `!`
- [!] Users (mirroring `ManagedUser`'s existing shape in `src/types/index.ts`, already well-modeled on the frontend). `BACKEND` `!`
- [!] Subscriptions, plans, country pricing, billing history. `BACKEND` `!`
- [!] Articles, categories, media assets. `BACKEND` `!`
- [!] Notifications (campaigns, schedules, delivery records). `BACKEND` `!`
- [!] Religious validations (reviewer directory, review records, version history). `BACKEND` `RELIGIOUS-CONTENT` `!`
- [!] Support tickets and messages. `BACKEND` `!`
- [!] Audit logs (admin actions, medical-export access). `BACKEND` `SECURITY` `!`
- [!] Medical export requests/records. `BACKEND` `MEDICAL` `!`

## 2.14 Admin ↔ Backend ↔ Mobile Integration

None of the following integration flows exist today — confirmed absent, not merely unaudited, since none of the underlying backends exist on either side yet:

- [ ] Admin article/content changes → mobile Library — the mobile app currently bundles its 72 articles in-app via `libraryContent.ts` (root `TODO.md` §2.21); no CMS-to-mobile pipeline exists. `BACKEND` `CROSS-PROJECT` `P2`
- [ ] Admin Premium/plan changes → mobile Premium state — the mobile app's `isPremium` is entirely local (`premiumStore.ts`) with no purchase SDK connected (root `TODO.md` §1.22/§2.19); nothing in the Admin can currently affect it. `BACKEND` `CROSS-PROJECT` `P1`
- [ ] Admin notifications → mobile push delivery — the mobile app has no server-push infrastructure at all (local-only `@notifee/react-native`); this Admin's Notifications section is itself unbuilt (§1.8). Both sides need building. `BACKEND` `CROSS-PROJECT` `P1`
- [ ] Admin feature flags → mobile behavior — neither side has any feature-flag infrastructure today. `BACKEND` `CROSS-PROJECT` `P3`
- [ ] Religious validation status → mobile content — the mobile Library has no `validated`/`reviewStatus` field on any article (root `TODO.md` §1.18); this Admin's validation workflow doesn't exist yet either (§1.7/§2.6). Both sides need to agree on the field/model before either builds it independently. `BACKEND` `CROSS-PROJECT` `RELIGIOUS-CONTENT` `P1`
- [ ] User suspension/deactivation (Admin) → mobile session/access enforcement — since neither a real Admin user-mutation backend (§2.3) nor real mobile authentication (root `TODO.md` §1.1, currently an explicit temporary bypass) exists, there is nothing to enforce yet on either end. `BACKEND` `CROSS-PROJECT` `SECURITY` `P1`
- [ ] Admin configuration (objectives/themes/global settings) → mobile consumption — mobile already has its own local objective/theme systems (root `TODO.md` §1.2/§1.23); any Admin-driven override would need to layer on top without breaking the existing local-first behavior. `BACKEND` `CROSS-PROJECT` `P3`

---

## Backend Integration Matrix

| Module | Frontend UI | Mock Data | Service Layer | Real API | Persistence | Status |
|---|---|---|---|---|---|---|
| Authentication | ✅ | n/a (hardcoded const) | ❌ none | ❌ | ❌ no session written | `[~]`/`[!]` |
| Dashboard | ✅ (period + refresh wired to scaled mock) | ✅ `dashboard.ts` | ❌ direct import | ❌ | n/a (read-only) | `[~]` |
| Users (read) | ✅ | ✅ `users.ts` | 🟡 `services/users.ts` (listing bypasses it) | ❌ | n/a | `[~]` |
| Users (mutate) | ✅ (dialogs) | — | ✅ `mutateUser()` seam exists | ❌ always throws | ❌ | `[!]` |
| Subscriptions (read) | ✅ | ✅ `subscriptions.ts` | ✅ `services/subscriptions.ts` | ❌ | n/a | `[~]` |
| Subscriptions (mutate) | ✅ | — | 🟡 local state only | ❌ | ❌ | `[~]` |
| Content management | ✅ | ✅ `content.ts` | ❌ no service layer at all | ❌ | ❌ | `[~]` |
| Spiritual content (read) | ✅ | ✅ `spiritual.ts` | ✅ `services/spiritual.ts` | ❌ | n/a | `[~]` |
| Spiritual content (mutate) | ✅ | — | ✅ seam exists | ❌ always throws | ❌ | `[~]` (UI) / `[!]` (write path) |
| Spiritual validation workflow | ✅ review dialog + approve/reject + history (session-only) | ✅ 6 seeded records | — | ❌ | ❌ session only | `[~]` |
| Notifications | ✅ compose/schedule/history (simulated) | ✅ `notifications.ts` | 🟡 `notificationsSessionStore` (in-memory) | ❌ | ❌ session only | `[~]` (delivery `[!]`) |
| Medical Exports | ✅ | ✅ `adminOperations.ts` | ✅ `services/adminOperations.ts` | ❌ | ❌ | `[~]` (download = stub toast; auth gate/audit `[!]`) |
| Support | ✅ | ✅ `adminOperations.ts` | ✅ `services/adminOperations.ts` | ❌ | ❌ | `[~]` |
| Analytics | ✅ (custom range + CSV export) | ✅ `adminOperations.ts` | ✅ `services/adminOperations.ts` | ❌ formulaically-scaled mock | ❌ | `[~]` |
| Configuration | ✅ 4 screens (session-only, not consumed) | ✅ `configuration.ts` | ❌ (local `useState`) | ❌ | ❌ | `[~]` |
| Security: Administrateurs / Rôles & permissions | ✅ CRUD + guards (session-only, no enforcement) | ✅ `security.ts` | 🟡 `securitySessionStore` (in-memory) | ❌ | ❌ session only | `[~]` |
| Security: Journaux d'activité / Demandes de données | ❌ `AdminRouteNotice` placeholder | ❌ none | ❌ | ❌ | ❌ | `[ ]` |

---

# 3. MOCK DATA / PLACEHOLDERS

Mock/seed data lives under `src/data/mock/` (7 files, ~2,244 lines total as of 2026-09-24 — `notifications.ts` was added), plus `src/data/configuration.ts` (340 lines) and `src/data/security.ts` (310 lines) for the newer Configuration/Security screens, and three in-memory session stores under `src/stores/` (`contentArticlesSessionStore`, `notificationsSessionStore`, `securitySessionStore`; module-level `useSyncExternalStore`, lost on reload). All currently present and in active use:

- **`users.ts`** (102 lines) — 32 hardcoded fictional names run through a deterministic generator (`toEmail`, etc.) producing `ManagedUser[]` (email/country/objective/plan/status/dates). Used by: `UsersContent.tsx` (listing, direct import) and `services/users.ts` (`getUserById`, proper seam). Real replacement needed: a Users API (§2.3).
- **`dashboard.ts`** (223 lines) — KPI tiles, user-growth chart, objective distribution, country breakdown, activity feed, alerts, premium-conversion chart — all literal arrays. Used directly by `DashboardContent.tsx` (no service wrapper at all). Real replacement needed: a Dashboard/Analytics aggregation API (§2.10).
- **`content.ts`** (459 lines) — content categories, 18 seeded articles, premium content items, media assets. Used directly by `src/app/content/components/*.tsx` (no service wrapper). Real replacement needed: a Content/CMS API + object storage (§2.5).
- **`adminOperations.ts`** (460 lines) — medical-export overview/history, 18 synthetic support tickets (`Array.from({length:18}, ...)`), and a per-period analytics dataset built via scaling factors. Used by `services/adminOperations.ts` (proper seam) → `MedicalExportsContent.tsx`, `SupportContent.tsx`, `AnalyticsContent.tsx`. Real replacement needed: Medical Exports, Support, and Analytics backends (§2.8/§2.9/§2.10).
- **`subscriptions.ts`** (604 lines) — 3 real-matching subscription plans (Gratuit/Premium Mensuel/Premium Annuel), overview KPIs, 15 active subscriptions, generated history, 6-country pricing, hardcoded regional revenue. Used by `services/subscriptions.ts` (proper seam) → all `/admin/abonnements/*` screens. Real replacement needed: Subscription API + payment provider (§2.4).
- **`spiritual.ts`** (160 lines) — religious articles derived by filtering `content.ts` (1 religious article); `mockSpiritualValidations` now holds 6 seeded validation records, while **`mockSpiritualEvents`, `mockSpiritualReminders`, `mockSpiritualHistory` are still hardcoded empty arrays** — not mocked, simply empty by design. Used by `services/spiritual.ts` (proper seam, but its two write functions always throw). Real replacement needed: Religious Content Validation API (§2.6).

**Demo credentials:** `src/config/admin.ts:10-13` — `ADMIN_DEMO_CREDENTIALS` (hardcoded email + plaintext password `admin123`), surfaced in the login UI itself with autofill/copy buttons. Must be removed before any non-local deployment (§1.1/§4).

**Additional seed data (not in `src/data/mock/`):** `notifications.ts` (125 lines — campaigns, `AUDIENCE_OPTIONS`; feeds the Notifications screens via `notificationsSessionStore`), `src/data/configuration.ts` (objectives, feature flags, themes, global settings — mirrors of mobile constants; used only by the four Configuration screens), `src/data/security.ts` (28 permission keys in 9 groups, 7 seeded roles, 7 seeded administrators — feeds `securitySessionStore` and the Validations reviewer picker).

**Placeholder route notices:** the shared `AdminRouteNotice` component (`src/components/admin/AdminRouteNotice.tsx`) is now used by exactly 2 routes: `securite/journaux-activite` and `securite/demandes-donnees` (10 of the 12 routes previously using it — Configuration ×4, Notifications ×3, Security administrateurs/roles-permissions — are now real screens). Each remaining one is honestly self-labeled as not-yet-built.

**Non-persistent forms (session-only, reset on reload):** Content Management (articles/categories/media/premium), Notifications (compose/schedule/edit/cancel), Configuration (objectives/flags/themes/global settings — these also reset on client-side navigation), Security (administrators/roles), Spiritual validation decisions, Subscription Plans/Country Pricing, Active Subscription edit/cancel, Support ticket mutations, Medical Export request mutations; Spiritual configuration/article panels actually throw rather than silently succeed.

---

# 4. SECURITY & PRIVACY

- [x] **`.env` git-ignore gap — resolved.** Re-verified 2026-09-24: the repo-root `.gitignore` (commit `a3e587a`, "chore: ignore environment files") now ignores `**/.env`, `**/.env.local`, `**/.env.production`, `**/.env.development` (with `!**/.env.example` kept), and `git check-ignore` confirms `web/admin/.env` and variants are ignored (`web/admin/.gitignore` itself still has no `.env` rule — the protection lives at the repo root only). Original finding, kept for context: `web/admin/.env` is present with 7 keys (`NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_ADSENSE_ID`, `NEXT_PUBLIC_SITE_URL`) — **all placeholder values today** (e.g. `"your-x-api-key-here"`, `dummy.supabase.co`), none referenced anywhere in `src/` (confirmed by grep — the Supabase vars in particular are dead config, no `@supabase/supabase-js` dependency exists). The gap: `web/admin/.gitignore` has no `.env`/`.env*` rule at all (only the repo-root `.gitignore` excludes `mobile/.env*`), so `web/admin/.env` is currently untracked but **would be committed by a future `git add -A`** the moment a real key is pasted in. Values today are safe (placeholders only); the guardrail against a *future* leak is what's missing. `SECURITY` `P0`
- [ ] Hardcoded demo password in source (`src/config/admin.ts:10-13`, `'admin123'`) — low sensitivity since the whole login is a client-side mock, but must not persist once real auth work begins; grep for this string before any deploy. `SECURITY` `P0`
- [x] No `localStorage`/`sessionStorage` usage anywhere in `src/` (confirmed by grep) — there is no client-side storage of session/auth state to worry about leaking, consistent with there being no real session at all yet. `SECURITY`
- [ ] **Third-party scaffold telemetry loads unconditionally in production.** `src/app/layout.tsx:60-62` loads `static.rocket.new`'s `rocket-web.js`/`rocket-shot.js`, pointing at `appanalytics.rocket.new`/`builtwithrocket.new` (the Rocket.new/DhiWise page-builder's own analytics), on every page, unconditionally — unlike the `@dhiwise/component-tagger` webpack loader in `next.config.mjs`, which correctly only runs `if (dev)`. For an admin that will eventually touch real user/health data, shipping a third-party SaaS's own telemetry by default is a privacy/scope concern. `SECURITY` `PRIVACY` `P0`
- [!] **Medical Exports has zero authorization gate** — see §1.9/§2.8 for full detail; listed here again because it is the highest-severity cross-cutting finding of this audit (blocked on real auth + RBAC enforcement). `SECURITY` `MEDICAL` `PRIVACY` `P0`
- [!] **No authentication/authorization enforcement exists anywhere in `web/admin`** — no `middleware.ts`, no session/cookie mechanism (re-verified 2026-09-24); any `/admin/**` URL is reachable with zero login, and the new Security screens (Administrateurs / Rôles & permissions) enforce nothing. Blocked on the auth backend/provider decision. See §1.1/§2.1/§2.2. `SECURITY` `P0`
- [x] No hardcoded API keys/tokens/production secrets found outside `.env`'s placeholder values and the demo password above (confirmed by grep for common patterns: `apiKey`, `secret`, `token =`, `Bearer `). `SECURITY`
- [ ] `next.config.mjs` sets `productionBrowserSourceMaps: true` — ships readable source maps to production, a minor information-disclosure surface worth a deliberate decision before any non-local deployment. `SECURITY` `P2`

---

# 5. TESTING & QUALITY

- [ ] **Zero automated tests of any kind.** Confirmed precisely: no `*.test.ts(x)`, `*.spec.ts(x)`, `__tests__/` directories, or `jest.config.*`/`playwright.config.*`/`cypress.config.*` exist anywhere in `web/admin` (excluding `node_modules`). No test framework is installed in `package.json` at all. `FRONTEND` `P2`
- [ ] Add a test framework (Jest + React Testing Library mirrors the mobile app's own convention; Vitest is a Next.js-native alternative). `FRONTEND` `P2`
- [ ] Prioritize tests for: login form validation logic; the Users/Subscriptions/Content list filter-sort-paginate logic (highest-complexity pure logic currently untested); the `mutateUser`/`mutateSpiritualContent`/`saveSpiritualConfiguration` seam once real implementations replace the throwing stubs. `FRONTEND` `P2`
- [ ] Route-level smoke tests once auth exists, to catch route-protection regressions. `FRONTEND` `SECURITY` `P2`
- [!] No RBAC tests exist (nothing enforceable to test yet — RBAC is display-only/unenforced, §1.13/§2.2; blocked on real enforcement). `SECURITY` `!`
- [ ] No accessibility tests exist beyond the 2 current ESLint a11y warnings tracked in §1.16. `FRONTEND` `P2`
- [x] **TypeScript** (`npm run type-check` / `tsc --noEmit`) — re-verified 2026-09-24: ✅ **0 errors.** `tsconfig.json` has `"strict": true` genuinely enabled.
- [~] **ESLint** (`npm run lint`, which runs the deprecated `next lint`) — re-verified 2026-09-24: ✅ **0 errors**, 🟡 **8 current warnings** (same set as before — none fixed, none new; a plain `npx eslint src` fails under ESLint 9 because the repo still uses `.eslintrc.json`):
  - `src/components/admin/operations/MedicalExportsContent.tsx:8:3` — `'Plus'` defined but never used.
  - `src/components/dashboard/KpiCard.tsx:65:9` — `'trendColor'` assigned but never used.
  - `src/components/ui/AppIcon.tsx:17:18` and `:30:86` — `any` type.
  - `src/components/ui/AppImage.tsx:22:18` and `:74:22` — `any` type; `:115:9` and `:127:5` — `alt-text` (see §1.16 — arguably false positives).
  `FRONTEND` `P3` (unused vars, trivial) / `P2` (the `any` types and a11y warnings)
- [x] **Next.js production build** (`npm run build`) — re-verified 2026-09-24: compiles successfully, 82/82 static pages generated. **Caveat, re-confirmed:** `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`, so a passing build does **not** by itself prove type/lint cleanliness — that's independently confirmed above only because `type-check`/`lint` were run standalone. Do not report `npm run build` passing as equivalent to "TypeScript/ESLint clean" in future audits — the two are decoupled by this config. `FRONTEND` `P1`

---

# 6. PRODUCTION READINESS

- [ ] Production authentication (§1.1/§2.1). `BACKEND` `SECURITY` `P0`
- [ ] Real backend APIs for every module in the Backend Integration Matrix above. `BACKEND` `P1`
- [ ] Database (§2.13) — none exists. `BACKEND` `P0`
- [!] Mock-data removal — only once each module's real backend is live; do not remove `src/data/mock/*` (nor `data/configuration.ts` / `data/security.ts`) prematurely (they are the only thing several screens currently render against). `FRONTEND` `BACKEND` `!`
- [ ] Demo credentials removal (`src/config/admin.ts`) — before any non-local deployment (still present: `admin123`, re-verified 2026-09-24). `SECURITY` `P0`
- [x] `.env*` git-ignored — done via the repo-root `.gitignore` (`**/.env`, `**/.env.local`, `**/.env.production`, `**/.env.development`; `web/admin/.gitignore` itself has no rule). See §4. `SECURITY` `P0`
- [ ] Rocket.new telemetry scripts removed or gated (`src/app/layout.tsx:60-62`). `SECURITY` `PRIVACY` `P0`
- [ ] Re-enable `typescript.ignoreBuildErrors: false` / `eslint.ignoreDuringBuilds: false` in `next.config.mjs` — currently safe to flip immediately since both are already clean. `FRONTEND` `P1`
- [ ] Deployment configuration (Vercel or equivalent) — no `vercel.json`/`netlify.toml`/`Dockerfile` in `web/admin` (a `@netlify/plugin-nextjs` devDependency is present but unconfigured); nothing beyond `next.config.mjs`. Also note `package.json`'s `start` script runs `next dev -p 4028` (the production start command is `serve`). `BACKEND` `P2`
- [ ] Environment configuration for a real backend (API base URL, etc.) — nothing reads an API base URL anywhere today since no service makes real HTTP calls. `BACKEND` `P1`
- [ ] Observability / error monitoring — none integrated; not deep-audited this pass, flag for a dedicated review once a backend exists to monitor. `BACKEND` `P2`
- [ ] Audit logging (§2.12) — none exists. `BACKEND` `SECURITY` `P0`
- [ ] Security review — this document IS a first security-focused pass; a dedicated review should follow once real auth/backend work begins. `SECURITY` `P1`
- [ ] Accessibility pass beyond the 2 current lint warnings (§1.16/§5). `FRONTEND` `P2`
- [ ] Responsive behavior improvements for large data tables on narrow viewports, if that becomes a real requirement (§1.15). `FRONTEND` `P3`
- [ ] Automated testing (§5) — none exists. `FRONTEND` `P2`
- [ ] Performance / bundle-size / image-optimization review — not audited this pass (out of scope for a business-logic/mock-vs-real audit); flag for a dedicated pass before production traffic. `FRONTEND` `P3`

---

# 7. COMPLETED / DEFERRED SUMMARY

## Genuinely complete (recorded so future work doesn't redo it)

- [x] Sidebar/Topbar/AppLayout navigation shell — nested/collapsible nav, active-route highlighting, mobile responsiveness, independent of the separately-verified `sidebar.png` background integration. `FRONTEND`
- [x] User detail page's dynamic `[id]` resolution, including a real 404 path for unknown ids — not decorative. `FRONTEND`
- [x] Client-side search/filter/sort/pagination logic across Users, Active Subscriptions, Subscription History, and Analytics' content table — correctly implemented, reusable once real data replaces the mock arrays underneath. `FRONTEND`
- [x] CSV export (Users list, Active Subscriptions, Subscription History) — genuinely functional client-side Blob/download, no backend needed for exporting already-loaded data. `FRONTEND`
- [x] Subscription plan model already matches the real AWA product exactly (Gratuit / Premium Mensuel / Premium Annuel) — confirmed no invented plan tiers exist anywhere. `FRONTEND`
- [x] Self-honest mock/demo architecture — `DemoNotice`/`HonestEmptyState`/capability-flag objects across Content, Subscriptions, Spiritual, Users, and Medical Exports consistently disclose "this doesn't persist" rather than faking success. Preserve this convention screen-by-screen as each area gets a real backend. `FRONTEND`
- [x] `tsconfig.json` has `strict: true` genuinely enabled, and `npm run type-check` is currently clean (0 errors). `FRONTEND`
- [~] Legacy `/content`, `/spiritual`, `/users` top-level `page.tsx` files are pure-redirect stubs, not divergent duplicate implementations — but `src/app/content/**` and `src/app/spiritual/**` also hold the shared component implementation (misleading paths; see §1.7). `FRONTEND`

## Deferred (blocked on something outside this codebase)

- [!] Real authentication provider choice — a product/architecture decision, not just frontend code. `BACKEND` `!`
- [!] Payment/IAP integration — depends on the mobile app's own purchase-SDK work (root `TODO.md` §5 Phase 6) landing first. `CROSS-PROJECT` `!`
- [!] Push notification delivery — depends on a server-push backend that doesn't exist anywhere in this repo yet. `CROSS-PROJECT` `BACKEND` `!`
- [!] Religious content scholar/organization sign-off — a business/product task, not engineering; per `CLAUDE.md` §7, no validation status should be presented as final without it, once the validation workflow itself is built. `RELIGIOUS-CONTENT` `!`
- [!] Hijri calendar computation engine choice — the mobile app already uses ICU-based conversion (root `TODO.md` §1.16); check for reuse before building a second implementation. `CROSS-PROJECT` `BACKEND` `!`
- [!] Feature-flag/configuration persistence model — a session-only UI and mock data (`data/configuration.ts`) now exist; a product decision on what is actually configurable, and a real data model/rollout mechanism, are still needed before any backend work. `BACKEND` `!`

---

## Frontend-only vs. Backend-dependent vs. Cross-project (quick reference)

**Can be implemented entirely within `web/admin` today:** remove/gate Rocket.new telemetry; re-enable build quality gates; fix the 8 lint warnings; remove the remaining duplicated chart data arrays (Premium conversion/Country distribution, leftover `defaultObjectiveData`) and the dead `FeatureFlag` type; add a test framework and initial tests; persist sidebar collapse state; wire Topbar search once there's local data to search; build the two remaining Security screens (Journaux d'activité, Demandes de données — session-only/mock first) and add their sidebar entries; add `loading.tsx`/`error.tsx` for the uncovered route groups; remove the demo-credential panel/claims and unsubstantiated 2FA/"end-to-end encryption" login copy; fix the misleading success toasts on Active Subscriptions and add a `DemoNotice` to the Subscriptions overview; align `spiritualCapabilities` and `BackendNotice` with the session-only Validations workflow. (Already done since the last audit: `.env*` git-ignoring, old `UsersContent.tsx` modal-system removal, Active Subscriptions tab-count fix.)

**Require backend/API/DB/auth-provider support (frontend seams already exist in most cases):** real auth + session + route guard; the `mutateUser`/`mutateSpiritualContent`/`saveSpiritualConfiguration` stubs; Dashboard/Analytics real aggregation; Content/Subscriptions/Support persistence; Medical Exports file-generation + storage + audit-log backend; Configuration and Security sections need their business logic built from scratch (no mock layer exists yet, unlike most other areas).

**Require coordination across `web/admin` / `backend` / `mobile`:** payment/IAP integration; push notification delivery; Hijri calendar computation (avoid a second engine); any user/subscription/plan data model must keep matching the mobile app's own `ObjectiveId`/plan model exactly (verified consistent today, §1.5 — must stay that way as both evolve); religious-validation status shared between Admin and mobile Library.
