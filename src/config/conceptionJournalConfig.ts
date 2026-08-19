import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {JournalSection} from '../types/journal';
import type {JournalRoute} from '../components/journal/DailyJournalSheet';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Single source of truth for "Essayer de concevoir"'s 5 fixed daily-tracking
// categories — shared by ConceiveDashboard's "Suivi du jour" card AND the
// TTC "Journal quotidien" sheet (see MainTabNavigator's JournalSheetHost),
// so the two entry points can never drift onto different category sets
// (same shared-config pattern as postpartumJournalConfig.ts/
// miscarriageJournalConfig.ts). Deliberately only these 5 — no Symptômes/
// Humeur/Sommeil/Hydratation/etc. TTC reuses the generic dailyJournalStore
// (temperature/cervicalMucus/lhTest/intimacy/symptoms fields), never a
// dedicated TTC-only store, so `section`/`route` map straight onto that
// existing store and its existing real entry screens.
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
    route: 'PrivateIntimacyUnlock',
    icon: 'heart-outline',
    label: 'Rapports',
    title: 'Rapports',
    subtitle: 'Rapports, protection et ressenti',
    tint: '#F9DCE8',
  },
  {
    section: 'symptoms',
    route: 'SymptomEntry',
    icon: 'chart-line',
    label: 'Évolution\ndu cycle',
    title: 'Évolution du cycle',
    subtitle: 'Note l’évolution de ton cycle aujourd’hui',
    tint: '#E9DFFF',
  },
];
