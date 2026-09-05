import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {JournalSection} from '../types/journal';
import type {JournalRoute} from '../components/journal/DailyJournalSheet';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Single source of truth for "Essayer de concevoir"'s 4 fixed daily
// USER-ENTERED tracking categories — shared by ConceiveDashboard's "Suivi du
// jour" card AND the TTC "Journal quotidien" sheet (see
// MainTabNavigator's JournalSheetHost), so the two entry points can never
// drift onto different category sets (same shared-config pattern as
// postpartumJournalConfig.ts/miscarriageJournalConfig.ts). Deliberately only
// these 4 — no Symptômes/Humeur/Sommeil/Hydratation/etc. TTC reuses the
// generic dailyJournalStore (temperature/cervicalMucus/lhTest/intimacy
// fields), never a dedicated TTC-only store, so `section`/`route` map
// straight onto that existing store and its existing real entry screens.
//
// "Évolution du cycle" is deliberately NOT in this array: it's a calculated/
// read-only cycle-phase view (JournalCycleEvolutionScreen, route
// 'CycleEvolutionEntry'), not something the user enters — so it has its own
// dedicated dashboard card in ConceiveDashboard.tsx instead of appearing
// here as a daily-tracking item.
export const CONCEPTION_JOURNAL_ITEMS: Array<{
  section: JournalSection;
  route: JournalRoute;
  icon: IconName;
  /** Suivi du jour grid tile — narrow, so a manual line break keeps the
   * 2-line wrap tidy. */
  label: string;
  /** Journal quotidien sheet row — full width, single natural line. */
  title: string;
  subtitle: string;
  tint: string;
}> = [
  {
    section: 'temperature',
    route: 'TemperatureEntry',
    icon: 'thermometer',
    label: 'Température\nbasale',
    title: 'Température basale',
    subtitle: 'Enregistre ta température du matin',
    tint: '#EEE3FA',
  },
  {
    section: 'cervicalMucus',
    route: 'CervicalMucusEntry',
    icon: 'water-outline',
    label: 'Glaire\ncervicale',
    title: 'Glaire cervicale',
    subtitle: 'Observe et note son évolution',
    tint: '#E4F3E7',
  },
  {
    section: 'lhTest',
    route: 'LHTestEntry',
    icon: 'test-tube',
    label: 'Test LH',
    title: 'Test LH',
    subtitle: 'Résultat de ton test d’ovulation',
    tint: '#FBE9F4',
  },
  {
    section: 'intimacy',
    route: 'JournalConceptionReports',
    icon: 'heart-outline',
    label: 'Rapports',
    title: 'Rapports',
    subtitle: 'Rapports, protection et ressenti',
    tint: '#F9DCE8',
  },
];
