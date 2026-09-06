import fs from 'fs';
import path from 'path';

// Static adoption guard for the floating-tab-bar content-clearance fix.
// Confirms every affected main-tab screen calls the ONE shared helper
// (src/theme/spacing.ts's getFloatingTabBarClearance) for its bottom
// padding instead of a screen-specific magic number, and that touching
// scroll clearance did not touch unrelated business logic.

const MOBILE_SRC = path.resolve(__dirname, '../../');

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(MOBILE_SRC, relativePath), 'utf8');
}

const FIXED_FILES: Array<[string, string]> = [
  ['ProfileScreen (Profil tab)', 'screens/ProfileScreen.tsx'],
  ['CycleHomeScreen (default Accueil dashboard)', 'screens/CycleHomeScreen.tsx'],
  ['PregnancyDashboard', 'components/pregnancy/PregnancyDashboard.tsx'],
  ['PostpartumDashboard', 'components/postpartum/PostpartumDashboard.tsx'],
  ['MiscarriageDashboard', 'components/miscarriage/MiscarriageDashboard.tsx'],
  ['ConceiveDashboard', 'components/conceive/ConceiveDashboard.tsx'],
  ['ContraceptionDashboard', 'components/contraception/ContraceptionDashboard.tsx'],
  ['MenopauseDashboard', 'components/menopause/MenopauseDashboard.tsx'],
  ['IrregularDashboard', 'components/irregular/IrregularDashboard.tsx'],
  ['CalendarScreen (Calendrier, Cycle)', 'screens/CalendarScreen.tsx'],
  ['PregnancyCalendarContent', 'components/pregnancy/PregnancyCalendarContent.tsx'],
  ['PostpartumCalendarContent', 'components/postpartum/PostpartumCalendarContent.tsx'],
  ['MiscarriageCalendarContent', 'components/miscarriage/MiscarriageCalendarContent.tsx'],
  ['ConceiveCalendarContent', 'components/conceive/ConceiveCalendarContent.tsx'],
  ['ContraceptionCalendarContent', 'components/contraception/ContraceptionCalendarContent.tsx'],
  ['MenopauseCalendarContent', 'components/menopause/MenopauseCalendarContent.tsx'],
  ['IrregularCalendarContent', 'components/irregular/IrregularCalendarContent.tsx'],
  ['StatisticsScreen (Statistiques, Cycle)', 'screens/StatisticsScreen.tsx'],
  ['IrregularStatisticsScreen', 'screens/irregular/IrregularStatisticsScreen.tsx'],
  ['MenopauseStatisticsScreen', 'screens/menopause/MenopauseStatisticsScreen.tsx'],
  ['PostpartumStatisticsScreen', 'screens/postpartum/PostpartumStatisticsScreen.tsx'],
  ['MiscarriageStatisticsScreen', 'screens/miscarriage/MiscarriageStatisticsScreen.tsx'],
  ['ConceiveStatisticsScreen', 'screens/conceive/ConceiveStatisticsScreen.tsx'],
  ['PregnancyStatisticsScreen', 'screens/pregnancy/PregnancyStatisticsScreen.tsx'],
  ['ContraceptionStatisticsScreen', 'screens/contraception/ContraceptionStatisticsScreen.tsx'],
];

describe('Floating tab bar content clearance — adoption guard', () => {
  it.each(FIXED_FILES)('%s calls the shared getFloatingTabBarClearance helper', (_label, relativePath) => {
    const source = readSource(relativePath);
    expect(source).toContain('getFloatingTabBarClearance');
    expect(source).toMatch(/getFloatingTabBarClearance\(insets\.bottom/);
  });

  it('ProfileScreen: logout logic and control are untouched', () => {
    const source = readSource('screens/ProfileScreen.tsx');
    expect(source).toContain('confirmSignOut');
    expect(source).toContain('styles.signOut');
  });

  it('CycleHomeScreen: the recommended-articles section is untouched', () => {
    const source = readSource('screens/CycleHomeScreen.tsx');
    expect(source).toContain('ObjectiveArticlesSection');
    expect(source).toContain("navigation.navigate('ArticleReader'");
  });

  it('the floating navbar file itself was not modified by this content-clearance fix', () => {
    const source = readSource('components/navigation/CustomBottomTabBar.tsx');
    expect(source).toMatch(/position:\s*['"]absolute['"]/);
    expect(source).toMatch(/backgroundColor:\s*['"]transparent['"]/);
    expect(source).not.toMatch(/getFloatingTabBarClearance/);
  });
});
