# AWA UI compliance audit against DESIGN.md (second pass)

Generated 2026-10-16 from the repository state. **Code-level only: nothing was rendered, built or installed; no device or emulator was used.** "Corrected and code-validated" means the source follows DESIGN.md and tsc / ESLint / Jest pass. **No file is "visually validated".**

## Method
1. Read DESIGN.md and the previous migration log (MIGRATION_PROGRESS.md).
2. Shared layer (lead): bottom tab bar item rebuilt to the Material 3 pill indicator (label no longer in a fixed 16 dp pill; icon 24; no lift/halo/underline); radii and the 11 sp floor that the runtime layer applied are now written into the source of every StyleSheet (1,586 literals in 212 files; sheet top corners 20-36 -> 28); runtime layer sheet threshold widened to 20.
3. A static scanner (AST based: ad-hoc buttons, arrow icons in CTAs, fixed heights on text, tight card padding, truncation, hex literals, serif/letterSpacing, shadows, gradients, loops, raw inputs) was run on all 336 UI files; ten family agents confirmed each finding in context, fixed it, and scanned for anything else.
4. Integration validation by the lead (below).

## Static scan, before -> after (336 UI files)
| Finding | Before | After |
|---|---:|---:|
| hex | 95 | 78 |
| numberOfLines | 255 | 78 |
| arrowIcon | 171 | 147 |
| heavyShadow | 86 | 34 |
| adHocButton | 130 | 92 |
| bigText | 22 | 17 |
| tightPadding | 68 | 45 |
| loopAnimation | 18 | 2 |
| gradient | 11 | 4 |
| smallTarget | 31 | 18 |
| fixedHeight | 108 | 85 |
| ctaArrow | 7 | 5 |
| fitText | 34 | 7 |
| rawTextInput | 37 | 33 |
| fontFamily | 28 | 24 |
| letterSpacing | 17 | 11 |
| rawSwitch | 1 | 1 |
| textShadow | 4 | 0 |
| ctaIcon | 2 | 1 |
| files with no finding | 78 | 108 |

Remaining findings are the judged exceptions listed per file below (list rows with chevrons, selectable options, calendar day cells, ring/hero numbers, modal scrims/elevation, identity colours, functional loading animations).

## Totals by family (rows of the per-file tables)
| Family | Compliant | Corrected and code-validated | Partially compliant |
|---|---:|---:|---:|
| Onboarding, auth, security, objective setup, managed-profile setup | 9 | 31 | 3 |
| Home, calendar, Hijri, cycle statistics | 9 | 19 | 3 |
| Irregular (SOPK) and menopause | 1 | 9 | 0 |
| Conceive and contraception | 0 | 7 | 1 |
| Pregnancy | 3 | 15 | 1 |
| Postpartum and miscarriage | 1 | 13 | 3 |
| Journal (mother and managed daughter) | 5 | 20 | 0 |
| Profile, settings, backup, premium, avatar | 11 | 14 | 3 |
| AwaADeux, partner, prayer, Qadaa | 13 | 14 | 2 |
| Library and articles | 70 | 18 | 3 |

Shared layer (lead): components/navigation/AnimatedTabItem, CustomBottomTabBar, PartnerBottomTabBar (Corrected and code-validated); theme/awaShapeLayer (sheet threshold), theme/awaThemeTokens (softToneInk helper); components/ui/* inspected, Compliant (no change needed). No file is Blocked.

## Onboarding, auth, security, objective setup, managed-profile setup (A_onboarding)


Validation: tsc 0 errors in family; eslint clean on 32 changed files; jest ~40 suites (787/789) + AuthThemeHardening 41/41; pattern run of src/screens objective-setup suites 216/220 passed (failures outside the family: 3 awaADeux suites, PregnancyPostpartumPartialThemeHardening [isDark branch in ContraceptionJournalEntryScreen], designSystemCoverage [pre-existing, docs folder missing]).
Status key: CCV = Corrected and code-validated, C = Compliant, P = Partially compliant.

| file | status | change / why left | residual |
|---|---|---|---|
| components/auth/HelpSupportModal | C | already Awa*; modal elevation | none |
| components/onboarding/BirthDatePickerModal | CCV | selected text onPrimaryContainer; month cell minH 48; day grid 14.2857%; hitSlop | day cells ~40 dp on 360 dp |
| components/onboarding/InlineCalendarPickerModal | CCV | day button 40 + hitSlop 4; cell minH 44 | day cells ~40 dp |
| components/onboarding/PremiumChoiceCard | CCV | horizontal padding 16 (shared by Miscarriage + Menopause setup) | none |
| components/security/DataAvailabilityBanner | C | | none |
| components/security/PinKeypad | CCV | error height -> minHeight | keypad left |
| AppLockScreen | P | read in full, no violations | no ScrollView by design; device pass at 360x640/1.3 |
| AuthScreen | CCV | removed text shadows; tabs primaryContainer + primary border; eye -> AwaIconButton (+role button); input minH; padding 16 | brand serif logotype and 2 raw composite TextInputs kept |
| ConceptionOnboardingScreens | CCV | selected-tile shadow removed; paddings 12; edit list -> AwaCard outlined; dead CTA style removed | |
| CycleInformationScreen | CCV | Yes/No/Unknown chips wrap (no fit/numberOfLines); padding 12/8; field 16; modal day 40; options 48 | own calendar modal duplicate of InlineCalendarPickerModal |
| CycleObjectiveConfirmationScreen | CCV | removed 2 Animated.loop, halo/ring, no-op gradient; title 28 SemiBold | |
| DiscreetLauncherScreen | CCV | identity card padding 16 | disguise preview colours = identity |
| FaceIdSetupScreen | CCV | message padding 12 | |
| ForgotPasswordScreen | CCV | removed numberOfLines on help text | |
| LocationScreen | CCV | input minH; paddings 16; elevation 6; titles not truncated; hitSlop | raw search input kept |
| MenopauseHormonalTreatment / LabTracking / Stage | C | PremiumChoiceCard + AwaButton (two skimmed) | |
| MenopauseSymptomsScreen | CCV | "clear" chip -> AwaButton text; paddings 12 | |
| MiscarriageBleedingScreen | C | flagged height is an image | |
| MiscarriageCycleReturnScreen | CCV | "remove date" -> AwaButton text; padding 12 | |
| MiscarriageDateScreen | CCV | "Modify" -> AwaButton; selected-date card -> AwaCard; dead glow styles removed; day 40 | month arrows kept |
| MiscarriageTryingAgainScreen | CCV | dead glow/circle styles removed | |
| NameOnboardingScreen | P | approved pilot kept; focus-ring shadow 0.15 | raw TextInput (animated focus ring); eyebrow letterSpacing kept |
| ObjectiveScreen | CCV | option cards got paddingVertical 12 (2-line labels touched border); radio/icon flexShrink 0 | |
| PinConfirm / PinManagement / PinSetup | C | | |
| PostpartumDeliveryDateScreen | CCV | as MiscarriageDate | |
| PostpartumDeliveryTypeScreen | CCV | hand-made CTA -> AwaButton large | |
| PostpartumFeedingScreen | C | | |
| RegistrationScreen | CCV | text shadow removed; tabs as Auth; eye -> AwaIconButton; paddings 16; social 48 | brand serif kept |
| SecuritySetupScreen | CCV | counter minHeight | |
| SpiritualPreferencesScreen | CCV | solid primary fill + shadow -> family selected state | |
| SplashScreen | CCV | removed decorative logo Animated.loop | entrance + progress kept |
| SummaryScreen | CCV | removed numberOfLines on user answers; counter minH | |
| WelcomeScreen | C | approved pilot: AwaButton large x2, no arrow | |
| contraception/ContraceptionInformationScreen | CCV | cards -> AwaCard outlined; Yes/No selected = primarySoft + primary border | |
| contraception/ContraceptionMethodScreen | CCV | flexShrink 0 | |
| contraception/PillScheduleScreen | CCV | 3 cards -> AwaCard outlined | |
| irregular/IrregularOnboardingScreens | CCV | tile shadow removed; paddings 12/16 | |
| managedProfile/ManagedProfileCycleSetupScreen | CCV | chips wrap; padding 12/8; selected text onPrimaryContainer | |
| managedProfile/ManagedProfileDaughterInfoScreen | C | | |
| managedProfile/ManagedProfileFirstPeriodScreen | CCV | card padding 16 | |
| managedProfile/ManagedProfileProgress | P | unchanged | a11y label hard-coded French "Étape x sur y" needs i18n key |
| managedProfile/ManagedProfileSuccessScreen | CCV | pill letterSpacing 0.5 | |
| managedProfile/ManagedProfileTypeScreen | C | | |

Test changed: AuthThemeHardening.test.tsx (field radius lookup 13 -> 12, `// DESIGN.md:`).


## Home, calendar, Hijri, cycle statistics (B1_home_calendar)


Validation: tsc 0 errors in family; eslint clean on changed files; jest 17 suites/243 tests + 194 tests pass; no tests changed. LibraryFamilyThemeHardening showed 8 failures during the run (library agent was editing concurrently) — lead re-checks at the end.

| file | status | change / why left | residual |
|---|---|---|---|
| calendar/CalendarHeader.tsx | Compliant | subtitle numberOfLines is secondary | none |
| calendar/CalendarHeaderAction.tsx | Compliant (left) | shared by 8 calendars, 56 dp chip, not a CTA | none |
| calendar/CycleTimelineCard.tsx | Corrected and code-validated | step label/date no longer truncated | none |
| calendar/FiltersSheet.tsx | Corrected and code-validated | row label no longer truncated; scrim/elevation = modal exception | none |
| calendar/LegendSheet.tsx | Corrected and code-validated | legend label no longer truncated | none |
| calendar/MonthCalendarCard.tsx | Corrected and code-validated | display-mode selector primaryContainer/onPrimaryContainer + outlined track, minHeight 40, accessibilityState, label not truncated, month title wraps; Today-cell rule untouched | selected day cell stays primary fill (calendar cell) |
| calendar/MonthHistoryStrip.tsx | Corrected and code-validated | month chips -> same filter-chip look as library/journal, hitSlop, accessibilityState | none |
| calendar/PeriodStartBottomSheet.tsx | Compliant | already Awa; modal | none |
| calendar/PredictionsCard.tsx | Corrected and code-validated | text no longer truncated | none |
| calendar/SelectedDayCard.tsx | Corrected and code-validated | ad-hoc period-start Pressable -> AwaButton tonal compact (rose label/border kept, rose alpha tint replaces fixed light fill); text not truncated | rose tint contrast in Dark to check |
| hijri/HijriMonthGrid.tsx | Corrected and code-validated | month title not truncated; day cell left | none |
| home/AnimatedProgressRing.tsx | Corrected and code-validated | fixed height -> minHeight; footnote in flow | ring values untouched; used by Contraception/Irregular (layout only) |
| home/CycleOverviewCard.tsx | Corrected and code-validated | values not truncated | none |
| home/CycleProgressRing.tsx | Compliant | ring-centre label | none |
| home/CycleStatusCard.tsx | Partially compliant | dead code (only CyclePhase type used) | consider moving type & deleting |
| home/DailyJournalCard.tsx | Corrected and code-validated | shortcut labels not truncated | none |
| home/HeroCycleCard.tsx | Corrected and code-validated | chip label/value not truncated | none |
| home/HomeHeader.tsx | Partially compliant | bell/profile custom (unread badge), 44 dp + hitSlop 8 | AwaIconButton badge slot wish |
| home/InAppNotificationCenter.tsx | Corrected and code-validated | "more" -> AwaIconButton; delete hitSlop 12; title/message not truncated; menu elevation 8 | item row keeps nested pressable |
| home/MotivationCard.tsx | Compliant | fixed colours on photo | none |
| home/ObjectiveArticlesSection.tsx | Compliant | list preview truncation | none |
| home/QuickActionsGrid.tsx | Corrected and code-validated | removed Animated.loop pulse; halo shadow 0.15/elev 4; dot hitSlop 14; label not truncated | armed state needs device check |
| home/SpiritualGuidanceCard.tsx | Corrected and code-validated | purity lines not truncated | identity colours kept |
| home/homeTheme.ts | Compliant | tokens | none |
| statistics/StatisticsPeriodSelector.tsx | Partially compliant | labels wrap; active label keeps theme.colors.primary (test pins it) | contrast on light palettes (Warm Sand) |
| CalendarScreen.tsx | Corrected and code-validated | edit bar elevation 6 | none |
| CycleHomeScreen.tsx | Corrected and code-validated | two ad-hoc period CTAs -> AwaButton tonal compact (rose label kept, test pins it) | none |
| CycleRemindersScreen.tsx | Corrected and code-validated | CTA plain filled AwaButton (shadow removed); title not shrunk; checkbox rows 48 dp | none |
| HijriCalendarScreen.tsx | Corrected and code-validated | shortcut rows -> AwaInfoRow; eyebrow letterSpacing 0.5; title not truncated | negative margin in card to check |
| HomeScreen / ObjectiveAwareCalendarScreen / ObjectiveAwareStatisticsScreen | Compliant (skimmed) | thin routers | none |
| StatisticsScreen.tsx | Compliant (skimmed) | | none |


## Irregular (SOPK) and menopause (B2_irregular_menopause)

Validation: tsc 0 errors in family; eslint clean on 9 changed files; jest 25 suites / 397 tests pass; no tests edited.

| file | status | change / why left |
|---|---|---|
| components/irregular/IrregularCalendarContent | Corrected and code-validated | hand-drawn "Modifier" rows with chevron CTA -> AwaButton tonal fullWidth no arrow; filter-sheet hand-drawn switch -> AwaSwitch (row Pressable accessible=false); numberOfLines removed on month title/legend/value; Today dashed cell untouched |
| components/irregular/IrregularDashboard | Corrected and code-validated | "Compléter le journal" -> AwaButton tonal with plus icon, no arrow; dailyItem padding 12; mainCard/dailyCard stay hand-made (embed ring/progress) |
| components/menopause/MenopauseCalendarContent | Corrected and code-validated | as Irregular calendar |
| components/menopause/MenopauseDashboard | Corrected and code-validated | stage "Modifier" -> AwaButton tonal; stage-modal confirm -> AwaButton filled large; "Suivi du jour" -> AwaCard; hero status padding 12/8; labels not truncated |
| screens/IrregularJournalEntryScreen | Corrected and code-validated | no-op gradients -> View; back -> AwaIconButton; header title in flow (wraps, no absolute overlay); choice tile padding 12; chip minHeight 40 |
| screens/MenopauseRemindersScreen | Compliant (read in full) | |
| screens/irregular/IrregularJournalOverviewScreen | Corrected and code-validated | back/calendar -> AwaIconButton tonal; row value not truncated |
| screens/irregular/IrregularStatisticsScreen | Corrected and code-validated | hero/empty cards -> AwaCard; paddings 16/12; month numbers 28; label not truncated; nested tinted panels remain (device check) |
| screens/menopause/MenopauseJournalEntryScreen | Corrected and code-validated | local JournalCard wraps AwaCard; ~9 ad-hoc buttons -> AwaButton; lab value/unit -> AwaTextField; duration minHeight; option cards wrap; save shadow removed; faint hero leaf ornaments kept (mother's illustrated hero, lead decision) |
| screens/menopause/MenopauseStatisticsScreen | Corrected and code-validated | 10 hand-made cards -> AwaCard; labels not truncated |

Device pass: Irregular journal header; Menopause lab rows at 360 dp DE/RU; two AwaTextField side by side; filter-sheet AwaSwitch inside Pressable row (TalkBack single switch, row tap toggles); Menopause "Suivi du jour" card.


## Conceive and contraception (C_conceive_contraception)

Validation: tsc 0 errors in family; eslint clean on 8 files; jest 20 suites / 307 tests pass. NOTE: PregnancyPostpartumPartialThemeHardening later flagged an `isDark ?` branch in ContraceptionJournalEntryScreen (lead to resolve).

| file | status | change / why left |
|---|---|---|
| components/conceive/ConceiveDashboard | Corrected and code-validated | removed both decorative Animated.loop + halo/glow views; "insufficient data" and "period started" CTAs -> AwaButton (period one outlined, pink kept, icon dropped); puck border -> surface, shadow .15; ring gradient stroke and ringDay hero number kept |
| components/conceive/ConceiveCalendarContent | Corrected and code-validated | period-start -> AwaButton outlined; value numberOfLines removed; segmented control minHeight 40; Today cell untouched; LH marker identity colours kept; hand-drawn filter switch left |
| components/contraception/ContraceptionCalendarContent | Corrected and code-validated | month prev/next -> AwaIconButton tonal; numberOfLines removed on month title/hijri range/selected rows/legend; Today cell untouched; hand-drawn filter switch left |
| components/contraception/ContraceptionDashboard | Partially compliant | "Modifier" pill -> AwaButton compact tonal; identical-colour gradient -> View; numberOfLines removed; shadows trimmed; padding 12/8; nested hand-made cards in 3.4k-line file not rebuilt on AwaCard |
| screens/conceive/ConceiveStatisticsScreen | Corrected and code-validated | CTA -> AwaButton; labels not truncated; period/tab pills minHeight 44 |
| screens/contraception/ContraceptionJournalEntryScreen | Corrected and code-validated | dark-mode fix for active taken/late/missed choice backgrounds via softTone(); light values unchanged (conflicts with a pinned test — lead to resolve) |
| screens/contraception/ContraceptionRemindersScreen | Corrected and code-validated | title fit/numberOfLines removed |
| screens/contraception/ContraceptionStatisticsScreen | Corrected and code-validated | heroPercent serif removed (data number); period buttons minHeight 44 |

Device pass: Conceive ring now static; period CTAs in dark (fixed #FCEEEF fill); contraception month-nav tonal buttons; dark status choice cards. Optional shared-layer: AwaButton iconColor; hand-drawn filter switches -> AwaSwitch.


## Pregnancy (D_pregnancy)

Validation: tsc 0 errors; eslint clean on 16 files; jest 13 suites / 218 tests + 15 of 16 importing suites pass (PregnancyPostpartumPartialThemeHardening fails on ContraceptionJournalEntryScreen guard — other family). No tests changed. No calculation code touched.
CCV = Corrected and code-validated; P = Partially; C = Compliant.

| file | status | change / why left |
|---|---|---|
| components/pregnancy/BabyDevelopmentImage | CCV | removed decorative idle Animated.loop float (entrance/exit kept) |
| components/pregnancy/DeliveryDateSheet | C | read fully; modal scrim/elevation exceptions |
| components/pregnancy/PostpartumCongratsCard | CCV | surface/border/shadow from theme tokens (dropped #FEFCFF, #7A56D6 shadow .28/30/16); icon colour theme.primary |
| components/pregnancy/PregnancyCalendarContent | CCV | hand-made filter switch -> AwaSwitch; mode selector outline track + primarySoft fill + text colour; dead styles removed; 3.4k lines grepped not read line by line |
| components/pregnancy/PregnancyDashboard | CCV | removed dead Animated.loop; CTA icon arrow/flower -> heart-outline; age/due/remaining wrap; hero height -> minHeight, week panel in flow |
| components/pregnancy/PregnancyEventDeleteConfirmModal | C | |
| components/pregnancy/PregnancyEventForm | CCV | type/offset chips selected = primarySoft + primary border + text colour, minH 40 |
| screens/pregnancy/PregnancyAppointmentScreen | CCV | header title wraps |
| screens/pregnancy/PregnancyAppointmentsScreen | P | title wraps; nested-delete row left; hard-coded French (i18n) |
| screens/pregnancy/PregnancyDatingSetupScreen | CCV | eyebrow letterSpacing 0.5; date field padding 12 |
| screens/pregnancy/PregnancyExamScreen | CCV | title wraps |
| screens/pregnancy/PregnancyMedicalInformationScreen | CCV | date-picker close/prev/next + toast close -> AwaIconButton; shadows trimmed; dead styles removed |
| screens/pregnancy/PregnancyNotificationsScreen | CCV | chips selected look; headers wrap; paddings 12; delete target 32 + hitSlop |
| screens/pregnancy/PregnancyRemindersScreen | CCV | title wraps |
| screens/pregnancy/PregnancyStatisticsScreen | CCV | eyebrow 0.5; hero number not serif; KPI/detail values not clamped; 4.1k lines — findings regions + styles |
| screens/pregnancy/PregnancySymptomsScreen | CCV | hero height -> minHeight |
| screens/pregnancy/PregnancyTrackingPreferencesScreen | C | read fully |
| screens/pregnancy/PregnancyWeekScreen | CCV | header title/subtitle not clamped (skimmed) |
| screens/pregnancy/PregnancyWeightScreen | CCV | unit badge minHeight; card padding 12; letterSpacing 0.5 (skimmed) |

Notes: selected chip/segment uses primarySoft + theme.colors.text (createStyles has no roles) — check other palettes; device pass: dashboard hero week panel in flow, calendar filter sheet (only the switch toggles), week screen without idle float.


## Postpartum and miscarriage (E_postpartum_miscarriage)

Validation: tsc 0 errors in family; eslint clean on 16 changed files; jest 21 suites / 514 tests pass; no test modified.
CCV = Corrected and code-validated; P = Partially compliant; C = Compliant.

| file | status | change / why left |
|---|---|---|
| components/miscarriage/MiscarriageCalendarContent | CCV | mode selector primaryContainer + outlined track + 40 dp (old selection was invisible in light); "past entry" -> AwaButton tonal; numberOfLines removed on info value; Today rule untouched; loss-event tints kept |
| components/miscarriage/MiscarriageDashboard | CCV | hero shadow override removed; unconfigured/daily cards -> AwaCard; CTAs -> AwaButton with arrows removed; journal row -> AwaCard onPress; doneBadge shadow removed; transition modal keeps shadow |
| components/postpartum/PostpartumCalendarContent | CCV | mode selector fix; numberOfLines removed on selected-day value; delivery/lochia tints kept |
| components/postpartum/PostpartumConsistencyModal | CCV | removed trailingIcon arrow-right from CTA |
| components/postpartum/PostpartumCycleStyleJournalLayout | CCV | back/header-save -> AwaIconButton; save -> AwaButton with loading, 0.22 shadow removed; dead styles removed |
| components/postpartum/PostpartumDashboard | CCV | #FFFFFF ring borders -> surface; heroDateBlock padding 12/10; daily labels not truncated |
| components/postpartum/PostpartumJournalScreenLayout | CCV | back -> AwaIconButton; save chip -> AwaButton large; compact title wraps; dead styles removed |
| components/postpartum/PostpartumSuccessToast | C | uses shared JournalSaveToast |
| components/postpartum/PostpartumWellnessRatingLayout | CCV | kicker padding 12/6; header title not truncated |
| screens/MiscarriageJournalEntryScreen | P | numberOfLines removed on option labels; white rings -> surface; 2.5k lines treated on findings, rest skimmed |
| screens/MiscarriageRemindersScreen | CCV | time-row hit area 48 |
| screens/PostpartumCycleReturnScreen | CCV | header back/help -> AwaIconButton; period action -> AwaButton compact (arrow/shadow removed); clear link -> AwaButton text; values not truncated; no date logic touched |
| screens/PostpartumJournalEntryScreen | CCV | numberOfLines removed on 5 option labels; qualityBox padding 4/6 |
| screens/PostpartumLochiaScreen | CCV | 6 ad-hoc buttons -> AwaButton; custom shadow removed; flowOption padding 8/6; labels not truncated; no lochia/Nifas logic touched |
| screens/PostpartumRemindersScreen | CCV | time-row hit area 48 |
| screens/miscarriage/MiscarriageStatisticsScreen | P | KPI/distribution/status labels not truncated; KPI centre value and chart labels kept; mostly raw Text/Pressable, only findings fixed |
| screens/postpartum/PostpartumStatisticsScreen | P | KPI/averages/timeline label not truncated; bar labels and KPI number kept |

Device pass: AwaIconButton in postpartum journal headers (40 dp visual); 3-line option label wrapping DE/TR/RU on 360 dp (5-box quality rows, 20 % daily tiles); AwaButton loading spinner on journal save; calendar mode selector light/dark.


## Journal (mother and managed daughter) (F_journal)


Validation: tsc 0 errors in journal paths; eslint clean on 20 changed source files + 1 test; jest journal screens+components 13 suites / 301 tests pass (DaughterJournalPresentation passes); 12 other suites rendering these screens, 235 tests pass.
Legend: fixed h -> minH = fixed height on a text container became minHeight; sel-text = selected-chip text primary -> onPrimaryContainer (contrast on primarySoft fill).

| file | status | change / why left |
|---|---|---|
| components/journal/ClearEntryButton | Compliant | AwaButton/AwaCard; modal elevation |
| components/journal/DailyJournalSheet | Corrected and code-validated | mother card subtitle numberOfLines 1 -> 2 (daughter already 2) |
| components/journal/JournalInputs | Compliant | LabeledInput = AwaTextField; RatingSelector/createJournalInputStyles are dead code |
| components/journal/JournalSaveToast | Compliant | close hitSlop 10; timings untouched |
| components/journal/JournalScreenLayout | Compliant | top bar, SectionCard (AwaCard filled), ChoiceChips (primaryContainer, bold, 40 + hitSlop 4), AwaButton conform |
| screens/PrivateAccessScreen | Corrected and code-validated | error line fixed h -> minH; keypad left |
| journal/HydrationScreen | Corrected and code-validated | sel-text; "Voir plus" Pressable has no onPress (dead, left) |
| journal/JournalActivityScreen | Corrected and code-validated | sel-text x3; shadow caps; duration labels hitSlop |
| journal/JournalCervicalMucusScreen | Corrected and code-validated | choice tile padding 5 -> 8 |
| journal/JournalConceptionReportsScreen | Corrected and code-validated | "Masquer" -> AwaButton outlined compact; hero/pill/select/time fixed h -> minH; pill padding 12 |
| journal/JournalCycleEvolutionScreen | Corrected and code-validated | removed 2 decorative Animated.loop + glow blob; entrance animations kept |
| journal/JournalFlowScreen | Compliant (skimmed) | legacy 4-line screen on shared layout; hard-coded French/Alert is an i18n/legacy matter |
| journal/JournalHydrationWeightScreen | Corrected and code-validated | quick-add pills -> AwaButton tonal/text; test updated |
| journal/JournalIntimacyScreen | Corrected and code-validated | "Masquer" -> AwaButton; time-sheet close -> AwaIconButton; fixed h -> minH; symptom tile padding 12 |
| journal/JournalLHTestScreen | Corrected and code-validated | time-sheet close -> AwaIconButton tonal; result choice padding 8 |
| journal/JournalMoodScreen | Corrected and code-validated | mood tile/level row/hero fixed h -> minH; label 2 lines (no ellipsis); daughter layout unchanged |
| journal/JournalNoteScreen | Corrected and code-validated | hide/show toggle -> AwaButton (>=400 dp) / AwaIconButton; toast shadow |
| journal/JournalPrivatePhotosScreen | Corrected and code-validated | header "Masquer" -> AwaButton; fixed h -> minH; card padding 12 |
| journal/JournalSleepScreen | Corrected and code-validated | quality tiles, counter row, time box, hero fixed h -> minH; +/- hitSlop; time-sheet close -> AwaIconButton |
| journal/JournalSymptomsScreen | Corrected and code-validated | sel-text x5; hero minH; serif hero title kept |
| journal/JournalTemperatureScreen | Corrected and code-validated | time-sheet close -> AwaIconButton tonal |
| journal/MenstrualFlowScreen | Corrected and code-validated | "Période terminée" -> AwaButton outlined (theme colour; was period pink); identical-colour LinearGradient -> View; shadow colour -> theme primary; labels wrap; sel-text; mother hero + daughter branch preserved |
| journal/PrivateIntimacyFaceIdScreen | Corrected and code-validated | error line minH |
| journal/PrivateIntimacyPinScreen | Corrected and code-validated | error line minH; badge shadow 0.15 |
| journal/PrivateIntimacyUnlockScreen | Corrected and code-validated | badge shadow 0.15; option rows with chevron kept |

Test changed: JournalHydrationWeightAndCycleEvolutionThemeFix.test.tsx (pinned primarySoft/textSecondary of replaced pills; now requires AwaButton, `// DESIGN.md:` comment).
Mother/daughter: mother heroes/illustrations/layout kept (only height -> minHeight where text); daughter branches unchanged; presentations not merged.
Residual / lead: 7 journal screens keep a hand-copied toast next to shared JournalSaveToast (shadow capped only; migrating changes timing/goBack); device pass at 360x640 / font 1.3 on Mood tiles, Sleep quality row, MenstrualFlow 5-col intensity, header AwaButtons next to long DE/RU titles; MenstrualFlow period-ended button lost its period-pink outline (decision for lead).


## Profile, settings, backup, premium, avatar (G1_profile_settings)


Validation: tsc (family paths) 0 errors; eslint --max-warnings=0 on 17 changed files clean; jest 26 suites / 419 tests + 13 suites / 188 tests pass.

| file | status | changed / why left | residual |
|---|---|---|---|
| components/appearance/ThemePreview.tsx | Compliant | palette preview illustration, literals kept | none |
| components/notifications/NotificationPermissionNotice.tsx | Corrected and code-validated | card padding 12/11 -> 16/12 | none |
| components/premium/HawaPremiumBottomSheet.tsx | Corrected and code-validated | removed crown/sparkle Animated.loop, emblem glow, press-scale wrapper; gradient CTA -> AwaButton on #4F2A96 (plan/price caption below); removed chevron on non-interactive card; removed adjustsFontSizeToFit/numberOfLines on hero title, benefit title, price; card padding 16; close button 40 + hitSlop; eyebrow letterSpacing 0.5 | hero gradient, gold crown, ribbon, benefit tints kept (brand identity); CTA contrast on light palettes needs device check |
| components/premium/PremiumLockedCard.tsx | Compliant | already AwaCard + AwaButton | none |
| components/profile/AnonymousAvatar.tsx | Compliant (skimmed) | illustration | none |
| components/profile/ManagedProfileDeleteConfirmModal.tsx | Compliant | modal elevation exception | none |
| components/profile/ManagedProfileSwipeRow.tsx | Compliant | delete action of a swipe-gesture row | none |
| components/profile/anonymousAvatarIllustrations.tsx | Compliant (skimmed) | illustration | none |
| screens/AboutScreen.tsx | Corrected and code-validated | logo frame padding 7 -> 12, shadow 0.12, toast padding/elevation | none |
| screens/AnonymousAvatarCustomizerScreen.tsx | Corrected and code-validated | tile padding 12; removed adjustsFontSizeToFit on tile labels/header | none |
| screens/AnonymousModeCreatingScreen.tsx | Partially compliant | Animated.loop is the functional progress spinner | kept on purpose |
| screens/AnonymousModeLimitationsScreen.tsx | Corrected and code-validated | header height -> minHeight | none |
| screens/AnonymousModeScreen.tsx | Corrected and code-validated | header minHeight; removed chevron on non-pressable card | none |
| screens/AnonymousModeSuccessScreen.tsx | Corrected and code-validated | header minHeight | none |
| screens/AppearanceScreen.tsx | Corrected and code-validated | back -> AwaIconButton; "Voir tout" -> AwaButton text; active segment shadow 0.15; dead styles removed | mode segments/palette cards are selectable options (Pressable); palettes untouched |
| screens/BackupDataScreen.tsx | Corrected and code-validated | back -> AwaIconButton; DataRow padding 16/12; toast | row chevrons are list rows |
| screens/BackupUtilityScreens.tsx | Corrected and code-validated | back -> AwaIconButton; removed fit/numberOfLines on header/choice label; premium upgrade -> AwaButton no chevron; padding 16/12; removed lock-tile shadow; 8 dead styles deleted | typed-word confirm TextInput stays raw; checkbox/radio rows are options |
| screens/DataPrivacyScreens.tsx | Compliant | already Awa components | none |
| screens/DataRecoveryScreen.tsx | Compliant | | none |
| screens/GeneralHealthScreen.tsx | Partially compliant | 2 labelled TextInputs -> AwaTextField; blood choice padding 8; largeInput 28; toast; removed numberOfLines on choice label | numeric unit input and 500-char notes box stay raw; skimmed (2.9k lines) |
| screens/HelpSupportScreen.tsx | Corrected and code-validated | "Voir tout ›" glyph -> trailingIcon; dead serif style removed; method card padding 12; chips 40 min height + hitSlop + selected text onPrimaryContainer; toast | method cards stay pressable cards |
| screens/LegalDocumentScreen.tsx | Compliant | | none |
| screens/PersonalInformationScreen.tsx | Corrected and code-validated | removed numberOfLines on row values / fit on title; option padding 16; selected option text colour + bold + check | country search stays raw |
| screens/PortableBackupScreen.tsx | Compliant | | none |
| screens/PrivacyScreen.tsx | Corrected and code-validated | guarantee row padding 16/12 | none |
| screens/PrivacySecurityScreen.tsx | Corrected and code-validated | removed adjustsFontSizeToFit on title | none |
| screens/ProfileScreen.tsx | Partially compliant | Premium card: removed 4 Animated.loop, glow, 2 orbs, shine bar, star, CTA chevron; neutral shadow; padding 16; identity-card gradient -> surface; manage-profiles/9 sheet close/steppers -> AwaIconButton; activation-choice selected state primarySoft + primary border; dead styles deleted | Premium card keeps brand colours/serif title; inner "button" is a View inside card Pressable; skimmed (5.4k lines) |
| screens/SupportResourcesScreens.tsx | Compliant | | none |

Tests changed: components/premium/__tests__/HawaPremiumBottomSheetThemeMigration.test.tsx (sheet-root radius lookup 34 -> 28; CTA gradient hex pin -> flat '#4F2A96'), both with `// DESIGN.md` comments.
Device pass needed: Premium sheet CTA/caption on light palettes; Profile Premium card spacing; GeneralHealth treatment field trailing button; activation choices in Dark/True Black.


## AwaADeux, partner, prayer, Qadaa (G2_awaadeux_spiritual)

Validation: tsc 0 errors; eslint clean; jest 24 suites / 575 tests, 4 failing (stale borderRadius === 18 selectors after the radii codemod — lead fixes). No religious wording/values/colours changed.
CCV = Corrected and code-validated; P = Partially; C = Compliant.

| file | status | change / why left |
|---|---|---|
| components/prayer/NextPrayerCard | C | short uppercase micro-label letterSpacing |
| components/prayer/PeriodEndBottomSheet | CCV | sheet top corners 26 -> awaShapes.extraLarge (28) |
| components/prayer/PrayerScheduleList | CCV | raw Text -> AwaText; active row primaryContainer/onPrimaryContainer; row padding 12 |
| components/prayer/PurityStatusCard | C | period dot identity colour; "→" is a time range |
| components/qadaa/QadaaDeleteConfirmModal | CCV | radii 28/12 via awaShapes |
| components/qadaa/QadaaLedgerSections | CCV | row title not clamped; badge text onPrimaryContainer |
| components/qadaa/QadaaManualEntryModal | P | radii awaShapes; selected text onPrimaryContainer; stepper/note inputs, year dropdown left custom |
| screens/FastingQadaaScreen | CCV | header minHeight; title not clamped; eyebrow 0.5; hero number + counter fade kept |
| screens/PrayerTimesScreen | CCV | title/location/date not clamped; selected Hijri option onPrimaryContainer |
| awaADeux/AwaADeuxBenefitsScreen | C | fit mode no scroll (device check) |
| awaADeux/AwaADeuxDialogs | C | demo strings French (i18n) |
| awaADeux/AwaADeuxIntroScreen | CCV | removed decorative breathing loop (withRepeat); entrance kept |
| awaADeux/AwaADeuxModalFrame | CCV | title numberOfLines removed |
| awaADeux/AwaADeuxPairingScreen | C | skimmed |
| awaADeux/AwaADeuxPartnerConnectedScreen | CCV | removed trailingIcon chevron on manage CTA |
| awaADeux/AwaADeuxPartnerNameScreen | C | fit layout at font scale 1.3 needs device check |
| awaADeux/AwaADeuxPartnerViewScreen | C | skimmed |
| awaADeux/AwaADeuxPendingScreen | C | dev-only chevron row |
| awaADeux/AwaADeuxSharingScreen | C | AwaSwitch/AwaCard |
| awaADeux/AwaADeuxStepLayout | CCV | removed unused ctaIcon prop/arrow |
| awaADeux/PartnerPreviewCard | C | skimmed |
| awaADeux/{BenefitsLayout,Demo,IntroLayout,Invitation,Navigation,PendingLayout}.ts, useEntrance.ts | C | non-visual |
| awaADeux/partner/AwaADeuxAcceptInvitationScreen | CCV | title wraps |
| awaADeux/partner/AwaADeuxInvitationScreen | C | |
| awaADeux/partner/PartnerAdviceScreen | CCV | removed decorative chevron on non-interactive rows |
| awaADeux/partner/PartnerCalendarScreen | CCV | month title not clamped |
| awaADeux/partner/PartnerHomeScreen | P | name/chip not clamped; SharedInfoTile fixed square kept (test pins it) — can clamp at font 1.3/de/ru/tr |
| awaADeux/partner/PartnerProfileScreen | CCV | logout card radius 28; info value not clamped |
| awaADeux/partner/PartnerScreenBackground | C | canonical gradient |

Test changed: AwaADeuxIntroAnimation.test.tsx ("breathes" -> "stays still" + source guard, `// DESIGN.md`).


## Library and articles (H_library)


| file | status | what changed / why left | residual |
|---|---|---|---|
| components/articles/ReadingControls.tsx | Corrected and code-validated | Removed numberOfLines=1 on title and subtitle (essential labels, long DE/RU/TR). Card chevron kept (tappable row). | Bottom bar may grow by one line at large font scale; READING_CONTROLS_SPACE (theme/spacing.ts, lead-owned) is a fixed 170 estimate - device pass. |
| components/library/ArticleCardSkeleton.tsx | Compliant | Animated.loop is the loading-placeholder pulse (functional feedback, no content shown yet); left. | Does not honour reduce-motion. |
| components/library/ArticlePremiumBadge.tsx | Compliant | Already AwaText + roles. |  |
| components/library/ArticleRow.tsx | Corrected and code-validated | Removed numberOfLines=1 on category label; title keeps 2 lines (list preview, full title in reader). |  |
| components/library/BookmarkButton.tsx | Compliant | Already AwaIconButton (48 dp target). |  |
| components/library/CategoryChipsBar.tsx | Corrected and code-validated | Chip is a selectable filter option (kept as Pressable, not AwaButton); removed numberOfLines=1 on the chip label. |  |
| components/library/CategoryListSheet.tsx | Corrected and code-validated | Row is a selectable gesture row (kept); removed numberOfLines=1 on category label (row has minHeight 56, grows). Chevron kept (list row). |  |
| components/library/ContinueReadingSection.tsx | Compliant | "Voir tout" text link with chevron kept (see-all link rule); numberOfLines on card title/summary/"min restantes" are list previews. |  |
| components/library/LibraryFiltersSheet.tsx | Partially compliant | Option chips: removed numberOfLines=1, added maxWidth 100% + paddingVertical 8 so labels wrap; scope buttons got padding 12/8. Chips and scope buttons are selectable options (kept). | Religieux scope uses gold #B7791F fill with fixed white text (spiritual identity colour, kept as literal). |
| components/library/LibraryHeader.tsx | Corrected and code-validated | Title: removed adjustsFontSizeToFit/numberOfLines=1; subtitle numberOfLines=2 removed; search clear hitSlop 12->16 (48 dp). Search box stays a custom TextInput (search box rule). |  |
| components/library/LibraryTrustBanner.tsx | Compliant | Already AwaCard + AwaText. |  |
| components/library/ProgressSection.tsx | Corrected and code-validated | Removed numberOfLines=1 on category pill label. "Voir tout" chevron link kept; card title keeps 2 lines (preview). |  |
| components/library/RecommendedCarousel.tsx | Corrected and code-validated | Removed trailingIcon arrow-right from the "Voir mes recommandations" CTA; removed numberOfLines on category pill, objective label and description. Card title keeps 2 lines (preview). |  |
| components/library/ReligiousPracticeSection.tsx | Partially compliant | Removed arrow-right from the "Voir tout le contenu religieux" button, label now wraps (flexShrink) with padding 16/8; removed numberOfLines=2 on tile label. | Gold section/tiles/button (#FFFDF7, #F0DDB2, #B7791F...) are the spiritual identity palette (kept). The gold outlined button stays a custom Pressable because AwaButton has no colour override (would change the colour). |
| components/library/TopicGrid.tsx | Corrected and code-validated | Removed numberOfLines=2 on topic title (card min height already flexible). "Voir tout" chevron link kept. |  |
| screens/FeaturedArticlesScreen.tsx | Corrected and code-validated | Header back/bookmark Pressables -> AwaIconButton (tonal, 48 dp); hero Text -> AwaText (serif title dropped, fixed scrim-safe colours kept); hero height 244 -> minHeight; fake "Lire l'article" View with arrow -> AwaButton compact (no arrow), footer wraps; popular cards -> AwaCard compact (padding 7 -> 12, width 112 -> 136, title no longer truncated); row bookmark -> shared BookmarkButton; badge radius 8, content padding 16. | The two "Voir tout" AwaButtons still have no onPress (pre-existing behaviour, untouched). Hero auto-rotates every 3 s with fade (existing feature, not Animated.loop) - left; dots keep 36 dp hit area. Hero text column stays 64% wide. |
| screens/LibraryScreen.tsx | Partially compliant | Back/search -> AwaIconButton; search field minHeight 48/padding 16/14 sp; tabs: fixed 40 -> minHeight 48, labels AwaText and wrap (no adjustsFontSizeToFit); recommended cards -> AwaCard (width 140, titles not truncated, padding 12); featured card height -> minHeight, text shadow removed, CTA arrow removed; article-row bookmark -> shared BookmarkButton and AwaText title/meta; category card label no longer truncated, padding 12, pill minHeight; info box padding 12 with AwaText (no warning-coloured text). | Category cards (3-column selectable cards) and segmented tabs kept custom (selectable options / sliding indicator); tab track padding 3 kept because the indicator geometry depends on it; remaining raw Text at 11 sp (objective label, category labels, featured card texts) rely on the runtime typography layer; featured title keeps numberOfLines=3 (pinned by a test, preview card). |
| screens/library/ArticleReaderScreen.tsx | Compliant | Skimmed render + styles (AwaText/AwaButton/AwaIconButton/BookmarkButton, no literals). |  |
| screens/library/BabyBluesArticleScreen.tsx | Compliant (template-verified) | Template-verified. heroLabel style (padding 8, letterSpacing 0.8, fontSize 11) is unused dead code ("currently unused"), left. |  |
| screens/library/BabyDevelopmentArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/BasalTemperatureArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/BirthControlPillsArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/BoneHealthArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/BreastfeedingArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/CervicalMucusArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/ChildbirthPrepArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/ChooseHormonalMethodArticleScreen.tsx | Compliant (template-verified) | Template-verified. Chevron at L974 is a list-row chevron, kept. |  |
| screens/library/ConceptionLifestyleArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/ConceptionStartArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/CyclePhasesArticleScreen.tsx | Compliant (template-verified) | Template-verified. FAQ accordion Pressable is an expandable row (kept); pressed opacity is press feedback; hero 270 is an image. |  |
| screens/library/CycleVitalSignArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/ExerciseCycleSupportArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/FastingQadaaArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/FertilityWindowArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/FiqhWomenIntroArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/FirstPeriodArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/FirstPeriodComingArticleScreen.tsx | Corrected and code-validated | Related-article card: fixed height 105 -> minHeight 105 (+ image alignSelf stretch), related title numberOfLines=3 removed. Editorial text untouched. |  |
| screens/library/FirstPeriodDailyLifeArticleScreen.tsx | Corrected and code-validated | Related-article card: fixed height 105 -> minHeight 105 (+ image alignSelf stretch), related title numberOfLines=3 removed. Editorial text untouched. |  |
| screens/library/FirstPeriodFaqArticleScreen.tsx | Corrected and code-validated | Related-article card: fixed height 105 -> minHeight 105 (+ image alignSelf stretch), related title numberOfLines=3 removed; contents-row question numberOfLines=1 removed. Editorial text untouched. |  |
| screens/library/FirstPeriodIrregularArticleScreen.tsx | Corrected and code-validated | Related-article card: fixed height 105 -> minHeight 105 (+ image alignSelf stretch), related title numberOfLines=3 removed. Editorial text untouched. |  |
| screens/library/FirstPeriodProtectionArticleScreen.tsx | Corrected and code-validated | Related-article card: fixed height 105 -> minHeight 105 (+ image alignSelf stretch), related title numberOfLines=3 removed. Editorial text untouched. |  |
| screens/library/FirstPeriodSignsArticleScreen.tsx | Corrected and code-validated | Related-article card: fixed height 105 -> minHeight 105 (+ image alignSelf stretch), related title numberOfLines=3 removed. Editorial text untouched. |  |
| screens/library/FlowColorsTexturesArticleScreen.tsx | Compliant (template-verified) | Template-verified. Flow colour swatches are medical identity colours (kept); textureImage/warningImage fixed heights are images. |  |
| screens/library/FlowMenstrualArticleScreen.tsx | Corrected and code-validated | Related-article card: fixed height 105 -> minHeight 105 (+ image alignSelf stretch), related title numberOfLines=3 removed. Editorial text untouched. |  |
| screens/library/HormonalTreatmentsPanoramaArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/HotFlashesArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/HydrationCycleArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/IstihadaArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/LhTestsArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/LochiaArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MedicalExamsArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MenopauseHormonesArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MenopauseTransitionArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MenopauseTreatmentsArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MenstruationPurityArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MiscarriageFertilityArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MiscarriageGriefArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MiscarriagePhysicalRecoveryArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MissedPillsArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/MoodHormonesArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/NidationArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/NifasFiqhArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/NifasMedicalArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/NutritionCycleArticleScreen.tsx | Compliant (template-verified) | Template-verified. mealImage fixed height is an image. |  |
| screens/library/OvulationArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PatchArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PcosCycleFertilityArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PcosDiagnosisArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PcosHormonalAcneArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PcosIntroArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PcosLifestyleManagementArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PcosMetabolismArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PcosSkinHairArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PerineumStrengtheningArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PeriodPainArticleScreen.tsx | Corrected and code-validated | Solution carousel cards padding 8 -> 12 (text no longer near the border). |  |
| screens/library/PmsArticleScreen.tsx | Corrected and code-validated | Tip carousel cards padding 8 -> 12. |  |
| screens/library/PostpartumPeriodReturnArticleScreen.tsx | Compliant (template-verified) | Template-verified (only finding: heroWrap 235 is an image hero). |  |
| screens/library/PostpartumRecoveryArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PrayerDuringMenstruationArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PregnancyExerciseArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/PregnancyWeeklyArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/RamadanFastingArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/RegularIrregularCycleArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/ReligiousFaqAfterLossArticleScreen.tsx | Compliant (template-verified) | Template-verified. arrow-right glyphs are diagram step connectors (not CTAs), kept. |  |
| screens/library/ReligiousFaqArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/ReturningToPrayerArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/SideEffectsArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/SleepHormonesArticleScreen.tsx | Compliant (template-verified) | Template-verified via grep + findings: heroWrap fixed height holds an image only, contents-row chevrons are list-row chevrons, no hex/fontFamily/shadow/numberOfLines/loop/Pressable CTA, no non-icon fixed heights, radii in 4/8/12/16/28 or pill/circle. |  |
| screens/library/UnderstandCycleArticleScreen.tsx | Compliant (template-verified) | Skimmed render + styles + grep: no findings. Phase colour hexes are feature identity colours (kept). |  |
| screens/library/UnderstandMenstrualFlowArticleScreen.tsx | Compliant (template-verified) | Template-verified. processCard fixed height 116 holds an image only. |  |
| screens/library/VaginalRingArticleScreen.tsx | Compliant (template-verified) | Template-verified. arrow-right glyphs are flow-diagram connectors, chevron in comparison rows is a list-row chevron; kept. |  |


## Validation of the integrated tree (lead, after all batches)
| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| ESLint `--max-warnings=0` on all of `src` | 0 errors, 0 warnings (run before the last 5-file chevron removal, which was re-linted on its own files) |
| Jest, default mode (complete suite) | 437 suites: 435 passed, 2 could not load; 14,582 tests passed, 0 failed |
| Jest, encrypted mode (`scripts/test-encrypted.js`, complete suite) | 437 suites: 435 passed, 2 could not load; 14,582 tests passed, 0 failed |

The 2 suites that did not load are pre-existing and unchanged: `src/theme/__tests__/designSystemCoverage.test.ts` and `designTokensFoundation.test.ts` read `docs/design-system/` files that are not in the working tree. Their tests were not executed.

## Tests whose assertions were changed (each carries a `// DESIGN.md` comment; none weakened)
Radius lookups that keyed on a legacy literal now key on the Material 3 value written in the source: ProfileScreen (sheet 28, dialog card 12), AwaADeuxAssociation (dialog card 12), AwaADeuxIntroScreen / AwaADeuxIntroAnimation (card 12), AuthThemeHardening (field 12), HawaPremiumBottomSheetThemeMigration (sheet 28; CTA is a flat AwaButton on #4F2A96). Visual pins replaced by their intended successor: CustomBottomTabBarThemeHardening (active indicator is now the pill, not the 13 x 2.5 underline), AwaADeuxIntroAnimation (decorative breathing loop removed -> "stays still" + source guard), JournalHydrationWeightAndCycleEvolutionThemeFix (hand-made pills -> AwaButton), LibraryFamilyThemeHardening (featured CTA is an AwaButton; arrow removed; shared BookmarkButton).

## Cross-cutting decisions and open items
- Selected chips: primaryContainer / onPrimaryContainer (or primarySoft + text colour inside `createStyles(theme)` factories that cannot reach `roles`). Equal on AWA Original; other palettes need the device pass.
- Period-start CTAs are AwaButton with period-rose label; fills differ slightly by family (rose alpha tint in cycle/calendar, fixed pale `#FCEEEF` in conceive) - check in Dark / True Black.
- Kept on purpose: functional loading animations (AnonymousModeCreating spinner, ArticleCardSkeleton pulse), Premium brand gradient / gold / violet, hero numbers, calendar Today cell and day cells, identity colours (period / fertility / lochia / journal-category tints), modal scrims and elevation, the mother's journal heroes and illustrations (daughter journal untouched in structure).
- `READING_CONTROLS_SPACE` (170) is a fixed estimate; the reading bar can now grow at large font scale / long languages - verify the end of an article is not hidden.
- `CycleStatusCard.tsx` is dead code except for the `CyclePhase` type; `components/library/*` sections are referenced only by tests; `ManagedProfileProgress` has a hard-coded French accessibility label (needs an i18n key; locale files were out of scope); JournalFlowScreen / JournalHydrationWeightScreen contain hard-coded French.
- Restore `docs/design-system/` so the 2 unloadable suites run.

## Screens that need a device / emulator pass (nothing here is visually validated)
Bottom tab bar (pill indicator, 11 sp labels in tr / de / ru, True Black); calendar month grid, mode selectors and filter sheets (AwaSwitch rows); Home hero and ring footnote; Premium sheet CTA contrast on light palettes; Profile Premium card; journal Mood / Sleep / MenstrualFlow rows and header buttons next to long de / ru titles at 360 x 640 and font scale 1.3; pregnancy dashboard hero (week panel now in flow); menopause lab rows; AwaADeux fit-layout screens; AppLock (no ScrollView) at 360 x 640; all six palettes in Light, Dark and True Black; Chinese / Russian font fallback.
