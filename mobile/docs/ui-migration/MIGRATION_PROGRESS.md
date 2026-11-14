# AWA UI migration to DESIGN.md — progress

Generated from the repository state (2026-10-15). Nothing was rendered: every status is code-level only.

## Status legend
- **Not started**: the source file was not changed. It is still covered at runtime by the global typography and shape layers (see below).
- **Implemented**: the source file was changed to follow DESIGN.md (codemod and/or component migration).
- **Code validated**: implemented and covered by a passing TypeScript / ESLint / Jest run.
- **Visually validated**: rendered and inspected on a device or emulator. **None yet.**
- **Blocked**: a documented blocker prevents the change.

## Global layers (apply to every screen and component at runtime, Android)
- `src/theme/awaTypography.ts`: every `Text` / `TextInput` is drawn with Inter 400/500/600 (weights 700+ read as SemiBold), `serif` as Fraunces, `monospace` as IBM Plex Mono; fonts are in `android/app/src/main/assets/fonts`, system fallback covers Cyrillic in Fraunces and hanzi.
- `src/theme/awaShapeLayer.ts`: every `StyleSheet.create` style gets the Material 3 radii (12 / 16, 28 for sheet top corners; circles and pills kept) and the 11 sp text floor.
- Installed first in `index.js` through `src/theme/installAwaDesign.ts`.

## Totals
- Files inventoried (screens, components, navigators): **333**
- Source changed by this migration: **291**
- Files using the shared `Awa*` components: **288**
- Not started: **42**
- Implemented: **0**, code validated: **291**, visually validated: **0**

- Last full validation: tsc 0 errors; ESLint --max-warnings=0 on 325 changed files clean; Jest default and encrypted 434/436 suites, 14,522/14,522 tests; the 2 unexecuted suites are listed below

## Validation (integrated tree, after all batches)
| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| ESLint `--max-warnings=0` on the changed files | 0 errors, 0 warnings |
| Jest, default mode (complete suite) | 436 suites: 434 passed, 2 failed; 14,522 tests passed, 0 failed |
| Jest, encrypted mode (`scripts/test-encrypted.js`, complete suite) | 436 suites: 434 passed, 2 failed; 14,522 tests passed, 0 failed |

**The 2 failing suites are pre-existing and not regressions**: `src/theme/__tests__/designSystemCoverage.test.ts` and `designTokensFoundation.test.ts` cannot load because they read `docs/design-system/COVERAGE.json` and `material3-tokens-normalized.json`, and that docs folder is not in the working tree (it was moved to the Recycle Bin). They contain 34 tests that were not executed.

**Passing TypeScript, ESLint and Jest does not prove visual correctness.** Nothing was rendered, built or installed.

## What was implemented
1. **Fonts**: Fraunces / Inter / IBM Plex Mono static files (400/500/600; Plex 400/500) with OFL licences, in `assets/fonts` and `android/app/src/main/assets/fonts`.
2. **Typography layer** (`src/theme/awaTypography.ts`, Android): all `Text`/`TextInput` map to Inter; `serif` → Fraunces; `monospace` → Plex Mono; weights ≥ 700 read as SemiBold (600), `fontWeight` reset so Android does not synthesize bold; nested `Text` keeps inheriting; system fallback draws Cyrillic in Fraunces and hanzi.
3. **Shape layer** (`src/theme/awaShapeLayer.ts`, Android): every `StyleSheet.create` style is mapped to 12 / 16 radii, 28 sheet top corners, circles/pills kept; 11 sp text floor.
4. **Codemods**: 355 decorative glow/blob elements removed (77 files); `serif` kept on titles/brand only (316 other entries removed); 12 card gradients flattened.
5. **Shared components**: `AwaText` display/headline roles use Fraunces; journal layout (top app bar with `AwaIconButton`, filled `AwaCard` sections, filter chips, `AwaTextField` inputs, `AwaButton` save) and toast; tab-bar add control square-rounded (16).
6. **Six component-migration batches** (onboarding/auth/security, main app + home/calendar/statistics, journal + pregnancy, conception/contraception/irregular/menopause/miscarriage/postpartum, spiritual + AwaADeux + partner + managed profile, library + premium): ad-hoc buttons → `AwaButton`, icon buttons → `AwaIconButton`, switches → `AwaSwitch`, cards → `AwaCard`, texts → `AwaText`, selected fields → `AwaTextField`, decorative elements removed.

## Deliberately not converted (documented, not hidden)
- Custom text inputs inside note boxes with counters/privacy pills/focus states, unit-suffixed number fields, search boxes without a label.
- Calendar day cells, ring text and chart labels (tuned metrics), the Today cell (dashed lavender), period-pink/medical/fertility/spiritual semantic colours and the Premium gold/violet literals.
- Selected-state option rows, rows with several pressable children, gesture rows (swipe), keypads, illustrations, animated hero art, the Splash brand artwork.
- Unreferenced/dead components were migrated by code only (`library/*` sections, `CycleStatusCard`), `ThemePreview` and `BotanicalDecoration` left untouched.
- Native `Alert.alert` dialogs (23 files) cannot be styled.
- `HawaPremiumBottomSheet` is partially migrated (restore CTA, decorative orbs); plan cards, hero and gradient CTA keep their brand structure.
- Looping breathing/halo animations remain in `ConceiveDashboard` (ring glow) and the quick-action reorder glow (functional feedback).

## Test assertions changed (each with a comment in the test; none weakened)
Structural lookups moved from `.parent`/first match to host nodes or alert roles after `AwaText`/`AwaCard`/`AwaButton` added a composite level (home, statistics, appearance, postpartum, irregular, awaADeux suites); legacy visual pins replaced by the Material 3 equivalent (glow assertion in `StatisticsFamilyThemeHardening`, `AuthThemeHardening` CTA colour source check, `Voir tout` link colour now the AA-safe `primaryAsText`, AwaADeux card radius/scale pins, `UnderstandCycle`), source-text pins updated for `<AwaSwitch`, `<AwaIconButton`, `<AwaButton` (`CalendarFamilyThemeHardening`, `floatingTabBarClearanceAdoption`, `LibraryFamilyThemeHardening`); `uiFoundationGuard` now limits imports of `components/ui` to `screens/` and `components/` instead of a two-screen allow-list; new guards `awaTypographyShapes.test.ts` and `ArticleMaterial3Components.test.tsx`.

## Visual checks that still need a device or emulator (none done)
Highest risk because of the global overrides: Calendar (month grid, legend, filters), cycle ring and home cards, statistics charts and period selector, bottom tab bar (11 sp labels, square add control), dense journal screens (flow, temperature, cervical mucus, LH), pregnancy week/statistics, the AwaADeux partner screens, Name/Welcome (Fraunces), and every screen in Russian, Chinese and German (Cyrillic/hanzi fallback, long compounds), Turkish "İstatistikler" tab label. Also verify all six palettes in Light, Dark and True Black, large font scale and 360×640. Android font rendering of the bundled static files is unverified until a build is installed.

## Global-layer audit (code level)
- 11 sp floor: style objects below 11 sp were scanned for fixed heights; the floor also lifts lineHeight to 16, so a fixed-height label could clip by 1-2 px on very small text. Not rendered, so unconfirmed.
- Radius map: circles/pills (>= 100, or equal to half a declared size) are kept; undeclared-size elements with a radius of 17-99 are mapped to 12/16 and could stop being circles. Needs the visual pass.
- Typography: per-style resolution cache added (performance); SVG-drawn text does not exist (react-native-svg used by 4 files, none draws text), so no chart label escapes the layer. iOS is untouched.
- Journal category tint literals (`#E9DFFF`, `#DDEEFF`, `#F9DDE8`, `#E8DDF8`, `#F3ECFB`, `#FBEAF0`) are per-category identity colours shared with calendar dots; kept on purpose (colours must not change).

## Open items
- Restore and version `docs/design-system/` so the 2 suites can load (not done: outside this task).
- Remaining `Partially` screens above; a screen-by-screen visual pass will decide which still need component work.
- Statuses below mean "source changed to follow DESIGN.md and covered by the passing automated runs", never "visually validated".

## Per file
| File | Kind | Lines | Source changed | Awa components | Status |
|---|---|---:|---|---|---|
| components/appearance/ThemePreview.tsx | component | 70 | no | — | Not started |
| components/articles/ReadingControls.tsx | component | 193 | yes | Button, Card, Text | Code validated |
| components/auth/HelpSupportModal.tsx | modal-host | 91 | yes | Button, Text | Code validated |
| components/BotanicalDecoration.tsx | component | 80 | no | — | Not started |
| components/calendar/CalendarHeader.tsx | component | 162 | yes | Text | Code validated |
| components/calendar/CycleTimelineCard.tsx | component | 86 | yes | Button, Card, Text | Code validated |
| components/calendar/FiltersSheet.tsx | sheet | 157 | yes | Button, Switch, Text | Code validated |
| components/calendar/LegendSheet.tsx | sheet | 397 | yes | Button, Text | Code validated |
| components/calendar/MonthCalendarCard.tsx | component | 521 | yes | Card, Text | Code validated |
| components/calendar/MonthHistoryStrip.tsx | component | 81 | yes | Card, Text | Code validated |
| components/calendar/PeriodStartBottomSheet.tsx | sheet | 264 | yes | Button, Text | Code validated |
| components/calendar/PredictionsCard.tsx | component | 85 | yes | Card, Text | Code validated |
| components/calendar/SelectedDayCard.tsx | component | 338 | yes | Button, Card, Text | Code validated |
| components/conceive/ConceiveCalendarContent.tsx | modal-host | 1714 | yes | Button, Card, IconButton, Text | Code validated |
| components/conceive/ConceiveDashboard.tsx | component | 1120 | yes | Button, Card, Text | Code validated |
| components/contraception/ContraceptionCalendarContent.tsx | modal-host | 1404 | yes | Button, Card, Text | Code validated |
| components/contraception/ContraceptionDashboard.tsx | modal-host | 3480 | yes | Card, IconButton, Text | Code validated |
| components/hijri/HijriMonthGrid.tsx | component | 201 | yes | Button, Card, IconButton, Text | Code validated |
| components/home/AnimatedProgressRing.tsx | component | 201 | yes | Text | Code validated |
| components/home/CycleOverviewCard.tsx | component | 112 | yes | Button, Card, Text | Code validated |
| components/home/CycleProgressRing.tsx | component | 181 | yes | Text | Code validated |
| components/home/CycleStatusCard.tsx | component | 702 | yes | Text | Code validated |
| components/home/DailyJournalCard.tsx | component | 180 | yes | Card, Text | Code validated |
| components/home/HeroCycleCard.tsx | component | 269 | yes | Card, Text | Code validated |
| components/home/HomeHeader.tsx | component | 226 | yes | Text | Code validated |
| components/home/homeTheme.ts | component | 28 | no | — | Not started |
| components/home/InAppNotificationCenter.tsx | modal-host | 573 | yes | Button, Text | Code validated |
| components/home/MotivationCard.tsx | component | 71 | yes | Text | Code validated |
| components/home/ObjectiveArticlesSection.tsx | component | 166 | yes | Button, Card, Text | Code validated |
| components/home/QuickActionsGrid.tsx | component | 295 | yes | Button, Card, Text | Code validated |
| components/home/SpiritualGuidanceCard.tsx | component | 712 | yes | Card, Text | Code validated |
| components/irregular/IrregularCalendarContent.tsx | modal-host | 1280 | yes | Button, Card, Text | Code validated |
| components/irregular/IrregularDashboard.tsx | component | 573 | yes | Text | Code validated |
| components/journal/ClearEntryButton.tsx | component | 52 | yes | Button | Code validated |
| components/journal/DailyJournalSheet.tsx | sheet | 278 | yes | Card, IconButton, Text | Code validated |
| components/journal/JournalInputs.tsx | component | 29 | yes | TextField | Code validated |
| components/journal/JournalSaveToast.tsx | toast | 170 | yes | — | Code validated |
| components/journal/JournalScreenLayout.tsx | component | 142 | yes | Button, Card, Icon, IconButton, Text | Code validated |
| components/library/ArticleCardSkeleton.tsx | component | 87 | yes | Card | Code validated |
| components/library/ArticlePremiumBadge.tsx | component | 56 | yes | Text | Code validated |
| components/library/ArticleRow.tsx | component | 72 | yes | Card, Text | Code validated |
| components/library/BookmarkButton.tsx | component | 45 | yes | IconButton | Code validated |
| components/library/CategoryChipsBar.tsx | component | 86 | yes | Text | Code validated |
| components/library/CategoryListSheet.tsx | sheet | 114 | yes | Text | Code validated |
| components/library/ContinueReadingSection.tsx | component | 84 | yes | Button, Card, Text | Code validated |
| components/library/LibraryFiltersSheet.tsx | sheet | 327 | yes | Button, Switch, Text | Code validated |
| components/library/LibraryHeader.tsx | component | 110 | yes | Button, IconButton, Text | Code validated |
| components/library/LibraryTrustBanner.tsx | component | 32 | yes | Card, Text | Code validated |
| components/library/ProgressSection.tsx | component | 91 | yes | Button, Card, Text | Code validated |
| components/library/RecommendedCarousel.tsx | component | 186 | yes | Button, Card, Text | Code validated |
| components/library/ReligiousPracticeSection.tsx | component | 160 | yes | Text | Code validated |
| components/library/TopicGrid.tsx | component | 95 | yes | Button, Card, Text | Code validated |
| components/menopause/MenopauseCalendarContent.tsx | modal-host | 1230 | yes | Button, Card, Text | Code validated |
| components/menopause/MenopauseDashboard.tsx | modal-host | 1773 | yes | Card, Text | Code validated |
| components/miscarriage/MiscarriageCalendarContent.tsx | modal-host | 1683 | yes | Button, Card, IconButton, Text | Code validated |
| components/miscarriage/MiscarriageDashboard.tsx | modal-host | 1607 | yes | Button, Card, Text | Code validated |
| components/navigation/AnimatedTabItem.tsx | component | 196 | no | — | Not started |
| components/navigation/CustomBottomTabBar.tsx | component | 178 | yes | — | Code validated |
| components/navigation/PartnerBottomTabBar.tsx | component | 86 | no | — | Not started |
| components/notifications/NotificationPermissionNotice.tsx | component | 183 | yes | Button, Text | Code validated |
| components/onboarding/BirthDatePickerModal.tsx | modal-host | 292 | yes | Text | Code validated |
| components/onboarding/InlineCalendarPickerModal.tsx | modal-host | 159 | yes | IconButton, Text | Code validated |
| components/onboarding/PremiumChoiceCard.tsx | component | 153 | yes | Text | Code validated |
| components/postpartum/PostpartumCalendarContent.tsx | modal-host | 1584 | yes | Button, Card, IconButton, Text | Code validated |
| components/postpartum/PostpartumConsistencyModal.tsx | modal-host | 141 | yes | Button, Card, Text | Code validated |
| components/postpartum/PostpartumCycleStyleJournalLayout.tsx | component | 306 | yes | Button, Card, Text | Code validated |
| components/postpartum/PostpartumDashboard.tsx | modal-host | 1331 | yes | Button, Card, Text | Code validated |
| components/postpartum/PostpartumJournalScreenLayout.tsx | component | 719 | yes | Card, Text | Code validated |
| components/postpartum/PostpartumSuccessToast.tsx | toast | 69 | no | — | Not started |
| components/postpartum/PostpartumWellnessRatingLayout.tsx | component | 465 | yes | Button, IconButton, Text | Code validated |
| components/prayer/NextPrayerCard.tsx | component | 95 | yes | Card, Text | Code validated |
| components/prayer/PeriodEndBottomSheet.tsx | sheet | 286 | yes | Button, Card, Text | Code validated |
| components/prayer/PrayerScheduleList.tsx | component | 115 | yes | Card, Text | Code validated |
| components/prayer/PurityStatusCard.tsx | component | 198 | yes | Button, Card, Text | Code validated |
| components/pregnancy/BabyDevelopmentImage.tsx | component | 66 | no | — | Not started |
| components/pregnancy/DeliveryDateSheet.tsx | sheet | 196 | yes | Button, Text | Code validated |
| components/pregnancy/PostpartumCongratsCard.tsx | modal-host | 198 | yes | Button, Text | Code validated |
| components/pregnancy/PregnancyCalendarContent.tsx | modal-host | 3484 | yes | Button, Card, IconButton | Code validated |
| components/pregnancy/PregnancyDashboard.tsx | component | 1868 | yes | Button, Card, Text | Code validated |
| components/pregnancy/PregnancyEventDeleteConfirmModal.tsx | modal-host | 163 | yes | Button, Text | Code validated |
| components/pregnancy/PregnancyEventForm.tsx | component | 774 | yes | Button, Card, Switch, TextField | Code validated |
| components/premium/HawaPremiumBottomSheet.tsx | sheet | 2164 | yes | Button | Code validated |
| components/premium/PremiumLockedCard.tsx | component | 70 | yes | Button, Card, Text | Code validated |
| components/profile/AnonymousAvatar.tsx | component | 63 | no | — | Not started |
| components/profile/anonymousAvatarIllustrations.tsx | component | 165 | no | — | Not started |
| components/profile/ManagedProfileDeleteConfirmModal.tsx | modal-host | 153 | yes | Button, Card, Text | Code validated |
| components/profile/ManagedProfileSwipeRow.tsx | component | 184 | no | — | Not started |
| components/qadaa/QadaaDeleteConfirmModal.tsx | modal-host | 196 | yes | Button, Text | Code validated |
| components/qadaa/QadaaLedgerSections.tsx | component | 318 | yes | Button, Card, Icon, Text | Code validated |
| components/qadaa/QadaaManualEntryModal.tsx | modal-host | 474 | yes | Button, Card, IconButton, Text | Code validated |
| components/security/DataAvailabilityBanner.tsx | component | 47 | yes | Card, Text | Code validated |
| components/security/PinKeypad.tsx | component | 20 | yes | — | Code validated |
| components/statistics/StatisticsPeriodSelector.tsx | component | 113 | yes | Text | Code validated |
| components/ui/AwaButton.tsx | component | 146 | no | Button, Icon, Text | Not started |
| components/ui/AwaCard.tsx | component | 97 | no | Card | Not started |
| components/ui/AwaIcon.tsx | component | 64 | no | Icon | Not started |
| components/ui/AwaIconButton.tsx | component | 92 | no | Icon, IconButton | Not started |
| components/ui/AwaInfoRow.tsx | component | 149 | no | Icon, InfoRow, Text | Not started |
| components/ui/AwaSwitch.tsx | component | 50 | no | Switch | Not started |
| components/ui/AwaText.tsx | component | 57 | yes | Text | Code validated |
| components/ui/AwaTextField.tsx | component | 222 | no | Icon, IconButton, Text, TextField | Not started |
| components/ui/index.ts | component | 12 | no | Button, Card, Icon, IconButton, InfoRow, Switch, Text, TextField | Not started |
| components/ui/pressFeedback.ts | component | 41 | no | — | Not started |
| components/ui/types.ts | component | 46 | no | — | Not started |
| navigation/AppNavigator.tsx | navigator | 619 | no | — | Not started |
| navigation/JournalSheetContext.tsx | navigator | 27 | no | — | Not started |
| navigation/MainTabNavigator.tsx | navigator | 354 | no | — | Not started |
| navigation/navigationRef.ts | navigator | 5 | no | — | Not started |
| navigation/PartnerMainTabNavigator.tsx | navigator | 48 | no | — | Not started |
| navigation/privateAccess.ts | navigator | 53 | no | — | Not started |
| screens/AboutScreen.tsx | modal-host | 696 | yes | Button, Card, IconButton, InfoRow, Text | Code validated |
| screens/AnonymousAvatarCustomizerScreen.tsx | screen | 925 | yes | Button, Card, IconButton, Text | Code validated |
| screens/AnonymousModeCreatingScreen.tsx | screen | 346 | yes | Button, Card, IconButton, Text | Code validated |
| screens/AnonymousModeLimitationsScreen.tsx | screen | 234 | yes | Button, Card, IconButton, Text | Code validated |
| screens/AnonymousModeScreen.tsx | screen | 394 | yes | Button, Card, IconButton, Text | Code validated |
| screens/AnonymousModeSuccessScreen.tsx | screen | 181 | yes | Button, Card, Text | Code validated |
| screens/AppearanceScreen.tsx | modal-host | 2429 | yes | Button, Switch, Text | Code validated |
| screens/AppLockScreen.tsx | screen | 831 | yes | Button, Text | Code validated |
| screens/AuthScreen.tsx | screen | 638 | yes | Button, Card, Text | Code validated |
| screens/awaADeux/awaADeuxBenefitsLayout.ts | screen-module | 80 | no | — | Not started |
| screens/awaADeux/AwaADeuxBenefitsScreen.tsx | screen | 96 | yes | Card, Text | Code validated |
| screens/awaADeux/awaADeuxDemo.ts | screen-module | 106 | no | — | Not started |
| screens/awaADeux/AwaADeuxDialogs.tsx | dialog | 170 | yes | Button, Text | Code validated |
| screens/awaADeux/awaADeuxIntroLayout.ts | screen-module | 111 | no | — | Not started |
| screens/awaADeux/AwaADeuxIntroScreen.tsx | screen | 287 | yes | Button, IconButton, Text | Code validated |
| screens/awaADeux/awaADeuxInvitation.ts | screen-module | 9 | no | — | Not started |
| screens/awaADeux/AwaADeuxModalFrame.tsx | modal-host | 137 | yes | Button, IconButton, Text | Code validated |
| screens/awaADeux/awaADeuxNavigation.ts | screen-module | 66 | no | — | Not started |
| screens/awaADeux/AwaADeuxPairingScreen.tsx | screen | 129 | yes | Card, Text, TextField | Code validated |
| screens/awaADeux/AwaADeuxPartnerConnectedScreen.tsx | screen | 198 | yes | Button, Card, Text | Code validated |
| screens/awaADeux/AwaADeuxPartnerNameScreen.tsx | screen | 251 | yes | Button, IconButton, Text, TextField | Code validated |
| screens/awaADeux/AwaADeuxPartnerViewScreen.tsx | screen | 59 | yes | Text | Code validated |
| screens/awaADeux/awaADeuxPendingLayout.ts | screen-module | 58 | no | — | Not started |
| screens/awaADeux/AwaADeuxPendingScreen.tsx | screen | 207 | yes | Button, Card, Text | Code validated |
| screens/awaADeux/AwaADeuxSharingScreen.tsx | screen | 118 | yes | Card, Switch, Text | Code validated |
| screens/awaADeux/AwaADeuxStepLayout.tsx | screen-module | 287 | yes | Button, IconButton, Text | Code validated |
| screens/awaADeux/partner/AwaADeuxAcceptInvitationScreen.tsx | screen | 188 | yes | Button, Card, Text | Code validated |
| screens/awaADeux/partner/AwaADeuxInvitationScreen.tsx | screen | 97 | yes | Card, Text | Code validated |
| screens/awaADeux/partner/PartnerAdviceScreen.tsx | screen | 152 | yes | Card, Text | Code validated |
| screens/awaADeux/partner/PartnerCalendarScreen.tsx | screen | 268 | yes | Card, IconButton, Text | Code validated |
| screens/awaADeux/partner/PartnerHomeScreen.tsx | screen | 540 | yes | Card, IconButton, Text | Code validated |
| screens/awaADeux/partner/PartnerProfileScreen.tsx | modal-host | 1041 | yes | Button, Card, Text, TextField | Code validated |
| screens/awaADeux/partner/PartnerScreenBackground.tsx | screen | 42 | yes | — | Code validated |
| screens/awaADeux/PartnerPreviewCard.tsx | screen-module | 194 | yes | Card, Text | Code validated |
| screens/awaADeux/useEntrance.ts | screen-module | 81 | no | — | Not started |
| screens/BackupDataScreen.tsx | modal-host | 370 | yes | Button, Card, Switch, Text | Code validated |
| screens/BackupUtilityScreens.tsx | screen | 2934 | yes | Button, Text | Code validated |
| screens/CalendarScreen.tsx | screen | 666 | yes | Button, Text | Code validated |
| screens/conceive/ConceiveStatisticsScreen.tsx | screen | 1959 | yes | Card, IconButton, Text | Code validated |
| screens/ConceptionOnboardingScreens.tsx | screen | 1578 | yes | Button, IconButton, Switch, Text | Code validated |
| screens/contraception/ContraceptionInformationScreen.tsx | screen | 325 | yes | Button, IconButton, Text | Code validated |
| screens/contraception/ContraceptionJournalEntryScreen.tsx | screen | 1298 | yes | Card, Text | Code validated |
| screens/contraception/ContraceptionMethodScreen.tsx | screen | 289 | yes | Button, IconButton, Text | Code validated |
| screens/contraception/ContraceptionRemindersScreen.tsx | screen | 383 | yes | Button, Card, IconButton, Switch, Text | Code validated |
| screens/contraception/ContraceptionStatisticsScreen.tsx | screen | 1947 | yes | Card, Text | Code validated |
| screens/contraception/PillScheduleScreen.tsx | screen | 447 | yes | Button, IconButton, Text | Code validated |
| screens/CycleHomeScreen.tsx | screen | 682 | yes | Card, Text | Code validated |
| screens/CycleInformationScreen.tsx | modal-host | 746 | yes | Button, Text | Code validated |
| screens/CycleObjectiveConfirmationScreen.tsx | screen | 998 | yes | Button, Card, Text | Code validated |
| screens/CycleRemindersScreen.tsx | screen | 516 | yes | Button, Card, IconButton, Switch, Text | Code validated |
| screens/DataPrivacyScreens.tsx | screen | 162 | yes | Button, Card, IconButton, Text, TextField | Code validated |
| screens/DataRecoveryScreen.tsx | screen | 129 | yes | Button, Card, IconButton, Text | Code validated |
| screens/DiscreetLauncherScreen.tsx | modal-host | 601 | yes | Button, Card, IconButton, Text | Code validated |
| screens/FaceIdSetupScreen.tsx | screen | 534 | yes | Button, Card, IconButton, Text | Code validated |
| screens/FastingQadaaScreen.tsx | modal-host | 844 | yes | Button, Card, IconButton, Text | Code validated |
| screens/FeaturedArticlesScreen.tsx | screen | 750 | yes | Button, Card, Text | Code validated |
| screens/ForgotPasswordScreen.tsx | screen | 362 | yes | Button, Card, IconButton, Text, TextField | Code validated |
| screens/GeneralHealthScreen.tsx | modal-host | 2930 | yes | Button, Text | Code validated |
| screens/HelpSupportScreen.tsx | modal-host | 307 | yes | Button, Card, IconButton, InfoRow, Text, TextField | Code validated |
| screens/HijriCalendarScreen.tsx | screen | 329 | yes | Button, Card, IconButton, Text | Code validated |
| screens/HomeScreen.tsx | screen | 92 | no | — | Not started |
| screens/irregular/IrregularJournalOverviewScreen.tsx | screen | 337 | yes | Card, Text | Code validated |
| screens/irregular/IrregularOnboardingScreens.tsx | screen | 958 | yes | Button, Card, IconButton, Switch, Text | Code validated |
| screens/irregular/IrregularStatisticsScreen.tsx | screen | 1327 | yes | Card, Text | Code validated |
| screens/IrregularJournalEntryScreen.tsx | screen | 2440 | yes | Button, Card, Text | Code validated |
| screens/journal/HydrationScreen.tsx | modal-host | 652 | yes | Button, IconButton, Text, TextField | Code validated |
| screens/journal/JournalActivityScreen.tsx | screen | 1579 | yes | Button, Card, IconButton, Text | Code validated |
| screens/journal/JournalCervicalMucusScreen.tsx | screen | 1051 | yes | Text | Code validated |
| screens/journal/JournalConceptionReportsScreen.tsx | modal-host | 72 | yes | Button, Card, IconButton, Text | Code validated |
| screens/journal/JournalCycleEvolutionScreen.tsx | screen | 1300 | yes | Text | Code validated |
| screens/journal/JournalFlowScreen.tsx | screen | 5 | no | — | Not started |
| screens/journal/JournalHydrationWeightScreen.tsx | screen | 7 | no | — | Not started |
| screens/journal/JournalIntimacyScreen.tsx | modal-host | 1427 | yes | Button, Card, IconButton, Text | Code validated |
| screens/journal/JournalLHTestScreen.tsx | modal-host | 1880 | yes | Button | Code validated |
| screens/journal/JournalMoodScreen.tsx | screen | 512 | yes | Button, Card, IconButton, Text | Code validated |
| screens/journal/JournalNoteScreen.tsx | screen | 981 | yes | Button, Card, IconButton, Text | Code validated |
| screens/journal/JournalPrivatePhotosScreen.tsx | modal-host | 624 | yes | Button, IconButton, Text | Code validated |
| screens/journal/JournalSleepScreen.tsx | modal-host | 1746 | yes | Button, Card, IconButton, Text | Code validated |
| screens/journal/JournalSymptomsScreen.tsx | screen | 1871 | yes | Button, Card, IconButton, Text | Code validated |
| screens/journal/JournalTemperatureScreen.tsx | modal-host | 1211 | yes | Button | Code validated |
| screens/journal/MenstrualFlowScreen.tsx | screen | 664 | yes | Button, IconButton, Text | Code validated |
| screens/journal/PrivateIntimacyFaceIdScreen.tsx | screen | 164 | yes | Button, IconButton, Text | Code validated |
| screens/journal/PrivateIntimacyPinScreen.tsx | screen | 159 | yes | IconButton, Text | Code validated |
| screens/journal/PrivateIntimacyUnlockScreen.tsx | screen | 160 | yes | IconButton, Text | Code validated |
| screens/LegalDocumentScreen.tsx | screen | 208 | yes | Card, IconButton, Text | Code validated |
| screens/library/ArticleReaderScreen.tsx | screen | 535 | yes | Button, Card, IconButton, Text | Code validated |
| screens/library/BabyBluesArticleScreen.tsx | screen | 2646 | yes | Card, IconButton, Text | Code validated |
| screens/library/BabyDevelopmentArticleScreen.tsx | screen | 724 | yes | Card, IconButton, Text | Code validated |
| screens/library/BasalTemperatureArticleScreen.tsx | screen | 1026 | yes | Card, IconButton, Text | Code validated |
| screens/library/BirthControlPillsArticleScreen.tsx | screen | 1054 | yes | Card, IconButton, Text | Code validated |
| screens/library/BoneHealthArticleScreen.tsx | screen | 738 | yes | Card, IconButton, Text | Code validated |
| screens/library/BreastfeedingArticleScreen.tsx | screen | 1807 | yes | Card, IconButton, Text | Code validated |
| screens/library/CervicalMucusArticleScreen.tsx | screen | 1084 | yes | Card, IconButton, Text | Code validated |
| screens/library/ChildbirthPrepArticleScreen.tsx | screen | 764 | yes | Card, IconButton, Text | Code validated |
| screens/library/ChooseHormonalMethodArticleScreen.tsx | screen | 1459 | yes | Card, IconButton, Text | Code validated |
| screens/library/ConceptionLifestyleArticleScreen.tsx | screen | 670 | yes | Card, IconButton, Text | Code validated |
| screens/library/ConceptionStartArticleScreen.tsx | screen | 594 | yes | Card, IconButton, Text | Code validated |
| screens/library/CyclePhasesArticleScreen.tsx | screen | 1459 | yes | Card, IconButton, Text | Code validated |
| screens/library/CycleVitalSignArticleScreen.tsx | screen | 1092 | yes | Card, IconButton, Text | Code validated |
| screens/library/ExerciseCycleSupportArticleScreen.tsx | screen | 1313 | yes | Card, IconButton, Text | Code validated |
| screens/library/FastingQadaaArticleScreen.tsx | screen | 828 | yes | Card, IconButton, Text | Code validated |
| screens/library/FertilityWindowArticleScreen.tsx | screen | 622 | yes | Card, IconButton, Text | Code validated |
| screens/library/FiqhWomenIntroArticleScreen.tsx | screen | 1143 | yes | Card, IconButton, Text | Code validated |
| screens/library/FirstPeriodArticleScreen.tsx | screen | 691 | yes | Card, IconButton, Text | Code validated |
| screens/library/FirstPeriodComingArticleScreen.tsx | screen | 735 | yes | Card, IconButton, Text | Code validated |
| screens/library/FirstPeriodDailyLifeArticleScreen.tsx | screen | 733 | yes | Card, IconButton, Text | Code validated |
| screens/library/FirstPeriodFaqArticleScreen.tsx | screen | 782 | yes | Card, IconButton, Text | Code validated |
| screens/library/FirstPeriodIrregularArticleScreen.tsx | screen | 703 | yes | Card, IconButton, Text | Code validated |
| screens/library/FirstPeriodProtectionArticleScreen.tsx | screen | 767 | yes | Card, IconButton, Text | Code validated |
| screens/library/FirstPeriodSignsArticleScreen.tsx | screen | 770 | yes | Card, IconButton, Text | Code validated |
| screens/library/FlowColorsTexturesArticleScreen.tsx | screen | 1344 | yes | Card, IconButton, Text | Code validated |
| screens/library/FlowMenstrualArticleScreen.tsx | screen | 881 | yes | Card, IconButton, Text | Code validated |
| screens/library/HormonalTreatmentsPanoramaArticleScreen.tsx | screen | 1919 | yes | Card, IconButton, Text | Code validated |
| screens/library/HotFlashesArticleScreen.tsx | screen | 1824 | yes | Card, IconButton, Text | Code validated |
| screens/library/HydrationCycleArticleScreen.tsx | screen | 1197 | yes | Card, IconButton, Text | Code validated |
| screens/library/IstihadaArticleScreen.tsx | screen | 997 | yes | Card, IconButton, Text | Code validated |
| screens/library/LhTestsArticleScreen.tsx | screen | 994 | yes | Card, IconButton, Text | Code validated |
| screens/library/LochiaArticleScreen.tsx | screen | 2080 | yes | Card, IconButton, Text | Code validated |
| screens/library/MedicalExamsArticleScreen.tsx | screen | 764 | yes | Card, IconButton, Text | Code validated |
| screens/library/MenopauseHormonesArticleScreen.tsx | screen | 1768 | yes | Card, IconButton, Text | Code validated |
| screens/library/MenopauseTransitionArticleScreen.tsx | screen | 1036 | yes | Card, IconButton, Text | Code validated |
| screens/library/MenopauseTreatmentsArticleScreen.tsx | screen | 719 | yes | Card, IconButton, Text | Code validated |
| screens/library/MenstruationPurityArticleScreen.tsx | screen | 919 | yes | Card, IconButton, Text | Code validated |
| screens/library/MiscarriageFertilityArticleScreen.tsx | screen | 1159 | yes | Card, IconButton, Text | Code validated |
| screens/library/MiscarriageGriefArticleScreen.tsx | screen | 1293 | yes | Card, IconButton, Text | Code validated |
| screens/library/MiscarriagePhysicalRecoveryArticleScreen.tsx | screen | 1101 | yes | Card, IconButton, Text | Code validated |
| screens/library/MissedPillsArticleScreen.tsx | screen | 1708 | yes | Card, IconButton, Text | Code validated |
| screens/library/MoodHormonesArticleScreen.tsx | screen | 1138 | yes | Card, IconButton, Text | Code validated |
| screens/library/NidationArticleScreen.tsx | screen | 637 | yes | Card, IconButton, Text | Code validated |
| screens/library/NifasFiqhArticleScreen.tsx | screen | 955 | yes | Card, IconButton, Text | Code validated |
| screens/library/NifasMedicalArticleScreen.tsx | screen | 2112 | yes | Card, IconButton, Text | Code validated |
| screens/library/NutritionCycleArticleScreen.tsx | screen | 1294 | yes | Card, IconButton, Text | Code validated |
| screens/library/OvulationArticleScreen.tsx | screen | 714 | yes | Card, IconButton, Text | Code validated |
| screens/library/PatchArticleScreen.tsx | screen | 1161 | yes | Card, IconButton, Text | Code validated |
| screens/library/PcosCycleFertilityArticleScreen.tsx | screen | 1338 | yes | Card, IconButton, Text | Code validated |
| screens/library/PcosDiagnosisArticleScreen.tsx | screen | 1615 | yes | Card, IconButton, Text | Code validated |
| screens/library/PcosHormonalAcneArticleScreen.tsx | screen | 1243 | yes | Card, IconButton, Text | Code validated |
| screens/library/PcosIntroArticleScreen.tsx | screen | 2020 | yes | Card, IconButton, Text | Code validated |
| screens/library/PcosLifestyleManagementArticleScreen.tsx | screen | 679 | yes | Card, IconButton, Text | Code validated |
| screens/library/PcosMetabolismArticleScreen.tsx | screen | 1268 | yes | Card, IconButton, Text | Code validated |
| screens/library/PcosSkinHairArticleScreen.tsx | screen | 1643 | yes | Card, IconButton, Text | Code validated |
| screens/library/PerineumStrengtheningArticleScreen.tsx | screen | 2791 | yes | Card, IconButton, Text | Code validated |
| screens/library/PeriodPainArticleScreen.tsx | screen | 901 | yes | Card, IconButton, Text | Code validated |
| screens/library/PmsArticleScreen.tsx | screen | 1129 | yes | Card, IconButton, Text | Code validated |
| screens/library/PostpartumPeriodReturnArticleScreen.tsx | screen | 1624 | yes | Card, IconButton, Text | Code validated |
| screens/library/PostpartumRecoveryArticleScreen.tsx | screen | 1680 | yes | Card, IconButton, Text | Code validated |
| screens/library/PrayerDuringMenstruationArticleScreen.tsx | screen | 893 | yes | Card, IconButton, Text | Code validated |
| screens/library/PregnancyExerciseArticleScreen.tsx | screen | 719 | yes | Card, IconButton, Text | Code validated |
| screens/library/PregnancyWeeklyArticleScreen.tsx | screen | 918 | yes | Card, IconButton, Text | Code validated |
| screens/library/RamadanFastingArticleScreen.tsx | screen | 896 | yes | Card, IconButton, Text | Code validated |
| screens/library/RegularIrregularCycleArticleScreen.tsx | screen | 1069 | yes | Card, IconButton, Text | Code validated |
| screens/library/ReligiousFaqAfterLossArticleScreen.tsx | screen | 1111 | yes | Card, IconButton, Text | Code validated |
| screens/library/ReligiousFaqArticleScreen.tsx | screen | 1114 | yes | Card, IconButton, Text | Code validated |
| screens/library/ReturningToPrayerArticleScreen.tsx | screen | 689 | yes | Card, IconButton, Text | Code validated |
| screens/library/SideEffectsArticleScreen.tsx | screen | 1648 | yes | Card, IconButton, Text | Code validated |
| screens/library/SleepHormonesArticleScreen.tsx | screen | 1081 | yes | Card, IconButton, Text | Code validated |
| screens/library/UnderstandCycleArticleScreen.tsx | screen | 870 | yes | Card, IconButton, Text | Code validated |
| screens/library/UnderstandMenstrualFlowArticleScreen.tsx | screen | 1292 | yes | Card, IconButton, Text | Code validated |
| screens/library/VaginalRingArticleScreen.tsx | screen | 1457 | yes | Card, IconButton, Text | Code validated |
| screens/LibraryScreen.tsx | screen | 1984 | yes | Button, Text | Code validated |
| screens/LocationScreen.tsx | screen | 579 | yes | Button, Card, IconButton, Text | Code validated |
| screens/managedProfile/ManagedProfileCycleSetupScreen.tsx | screen | 298 | yes | Card, IconButton, Text | Code validated |
| screens/managedProfile/ManagedProfileDaughterInfoScreen.tsx | modal-host | 306 | yes | Button, Card, Text, TextField | Code validated |
| screens/managedProfile/ManagedProfileFirstPeriodScreen.tsx | screen | 179 | yes | Card, Text | Code validated |
| screens/managedProfile/ManagedProfileProgress.tsx | screen-module | 64 | no | — | Not started |
| screens/managedProfile/ManagedProfileSuccessScreen.tsx | screen | 489 | yes | Button, Text | Code validated |
| screens/managedProfile/ManagedProfileTypeScreen.tsx | screen | 118 | yes | Card, Text | Code validated |
| screens/menopause/MenopauseJournalEntryScreen.tsx | screen | 2069 | yes | Card, IconButton, Text | Code validated |
| screens/menopause/MenopauseStatisticsScreen.tsx | screen | 738 | yes | Card, Text | Code validated |
| screens/MenopauseHormonalTreatmentScreen.tsx | screen | 345 | yes | Button, Text | Code validated |
| screens/MenopauseLabTrackingScreen.tsx | screen | 380 | yes | Button, Text | Code validated |
| screens/MenopauseRemindersScreen.tsx | screen | 632 | yes | Button, Card, IconButton, Switch, Text | Code validated |
| screens/MenopauseStageScreen.tsx | screen | 339 | yes | Button, Text | Code validated |
| screens/MenopauseSymptomsScreen.tsx | screen | 517 | yes | Button, Card, Text | Code validated |
| screens/miscarriage/MiscarriageStatisticsScreen.tsx | screen | 2658 | yes | Card, IconButton, Text | Code validated |
| screens/MiscarriageBleedingScreen.tsx | screen | 210 | yes | Button, Text | Code validated |
| screens/MiscarriageCycleReturnScreen.tsx | screen | 325 | yes | Button, Card, Text | Code validated |
| screens/MiscarriageDateScreen.tsx | screen | 451 | yes | Button, Text | Code validated |
| screens/MiscarriageJournalEntryScreen.tsx | screen | 2574 | yes | Text | Code validated |
| screens/MiscarriageRemindersScreen.tsx | screen | 492 | yes | Button, Card, IconButton, Switch, Text | Code validated |
| screens/MiscarriageTryingAgainScreen.tsx | screen | 242 | yes | Button, Text | Code validated |
| screens/NameOnboardingScreen.tsx | screen | 387 | no | Button, Icon, Text | Not started |
| screens/ObjectiveAwareCalendarScreen.tsx | screen | 80 | no | — | Not started |
| screens/ObjectiveAwareStatisticsScreen.tsx | screen | 74 | no | — | Not started |
| screens/ObjectiveScreen.tsx | screen | 191 | yes | Button, Text | Code validated |
| screens/PersonalInformationScreen.tsx | modal-host | 394 | yes | Button, Card, IconButton, Text, TextField | Code validated |
| screens/PinConfirmScreen.tsx | screen | 47 | yes | IconButton, Text | Code validated |
| screens/PinManagementScreen.tsx | screen | 61 | yes | Button, Card, IconButton, Text | Code validated |
| screens/PinSetupScreen.tsx | screen | 45 | yes | IconButton, Text | Code validated |
| screens/PortableBackupScreen.tsx | screen | 309 | yes | Button, Card, IconButton, Text, TextField | Code validated |
| screens/postpartum/PostpartumStatisticsScreen.tsx | screen | 1851 | yes | Card, IconButton, Text | Code validated |
| screens/PostpartumCycleReturnScreen.tsx | modal-host | 1758 | yes | Button, Card, Text | Code validated |
| screens/PostpartumDeliveryDateScreen.tsx | screen | 379 | yes | Button, Text | Code validated |
| screens/PostpartumDeliveryTypeScreen.tsx | screen | 535 | yes | Text | Code validated |
| screens/PostpartumFeedingScreen.tsx | screen | 308 | yes | Button, IconButton, Text | Code validated |
| screens/PostpartumJournalEntryScreen.tsx | screen | 1137 | yes | Card, IconButton, Text | Code validated |
| screens/PostpartumLochiaScreen.tsx | modal-host | 1221 | yes | Button, Card, IconButton, Text | Code validated |
| screens/PostpartumRemindersScreen.tsx | screen | 486 | yes | Button, Card, IconButton, Switch, Text | Code validated |
| screens/PrayerTimesScreen.tsx | modal-host | 373 | yes | Button, Card, IconButton, Text | Code validated |
| screens/pregnancy/PregnancyAppointmentScreen.tsx | screen | 113 | yes | IconButton, Text | Code validated |
| screens/pregnancy/PregnancyAppointmentsScreen.tsx | screen | 309 | yes | Button, IconButton, Text | Code validated |
| screens/pregnancy/PregnancyDatingSetupScreen.tsx | screen | 989 | yes | Button, IconButton, Text | Code validated |
| screens/pregnancy/PregnancyExamScreen.tsx | screen | 109 | yes | IconButton, Text | Code validated |
| screens/pregnancy/PregnancyMedicalInformationScreen.tsx | modal-host | 2464 | yes | Button, IconButton, Text | Code validated |
| screens/pregnancy/PregnancyNotificationsScreen.tsx | modal-host | 1539 | yes | Button, Card, IconButton, Switch, Text, TextField | Code validated |
| screens/pregnancy/PregnancyRemindersScreen.tsx | screen | 689 | yes | Button, IconButton, Switch, Text | Code validated |
| screens/pregnancy/PregnancyStatisticsScreen.tsx | screen | 4151 | yes | Card, Text | Code validated |
| screens/pregnancy/PregnancySymptomsScreen.tsx | screen | 407 | yes | Button, Card, IconButton, Text | Code validated |
| screens/pregnancy/PregnancyTrackingPreferencesScreen.tsx | screen | 604 | yes | Button, IconButton, Text | Code validated |
| screens/pregnancy/PregnancyWeekScreen.tsx | screen | 1592 | yes | Button, Card, IconButton, Text | Code validated |
| screens/pregnancy/PregnancyWeightScreen.tsx | modal-host | 783 | yes | Button, IconButton, Text | Code validated |
| screens/PrivacyScreen.tsx | screen | 339 | yes | Button, Card, Text | Code validated |
| screens/PrivacySecurityScreen.tsx | screen | 203 | yes | Card, IconButton, InfoRow, Switch, Text | Code validated |
| screens/PrivateAccessScreen.tsx | screen | 1007 | yes | Card, IconButton, Text | Code validated |
| screens/ProfileScreen.tsx | modal-host | 5420 | yes | Button, Text | Code validated |
| screens/RegistrationScreen.tsx | screen | 165 | yes | Button, Card, Text | Code validated |
| screens/SecuritySetupScreen.tsx | screen | 767 | yes | Button, Card, IconButton, Switch, Text | Code validated |
| screens/SpiritualPreferencesScreen.tsx | screen | 375 | yes | Button, Text | Code validated |
| screens/SplashScreen.tsx | screen | 252 | no | — | Not started |
| screens/StatisticsScreen.tsx | screen | 995 | yes | Card, Text | Code validated |
| screens/SummaryScreen.tsx | screen | 1310 | yes | Button, Card, Text | Code validated |
| screens/SupportResourcesScreens.tsx | screen | 137 | yes | Card, Icon, IconButton, InfoRow, Text | Code validated |
| screens/WelcomeScreen.tsx | screen | 351 | no | Button, Text | Not started |
