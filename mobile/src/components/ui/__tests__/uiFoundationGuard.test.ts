import fs from 'fs';
import path from 'path';

// Phase 2 guard rails:
//   1. the shared components never contain a raw colour or font-size literal (everything comes from the Phase 1 tokens);
//   2. NOTHING in the application imports them yet: no screen and no existing feature component was migrated.

const UI_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(__dirname, '..', '..', '..');

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    if (entry.name === 'node_modules') {return [];}
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('shared UI components — token discipline', () => {
  const sources = fs
    .readdirSync(UI_DIR)
    .filter(file => /\.tsx?$/.test(file))
    .map(file => ({file, text: stripComments(fs.readFileSync(path.join(UI_DIR, file), 'utf8'))}));

  it('contains the eight approved components and nothing else that renders UI', () => {
    const names = sources.map(source => source.file).sort();
    ['AwaText.tsx', 'AwaIcon.tsx', 'AwaIconButton.tsx', 'AwaButton.tsx', 'AwaTextField.tsx', 'AwaCard.tsx', 'AwaSwitch.tsx', 'AwaInfoRow.tsx'].forEach(
      expected => expect(names).toContain(expected),
    );
    expect(names.filter(name => /\.tsx$/.test(name)).sort()).toEqual(
      ['AwaButton.tsx', 'AwaCard.tsx', 'AwaIcon.tsx', 'AwaIconButton.tsx', 'AwaInfoRow.tsx', 'AwaSwitch.tsx', 'AwaText.tsx', 'AwaTextField.tsx'],
    );
  });

  it('has no raw hex colour literal', () => {
    sources.forEach(({file, text}) => {
      expect([file, text.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []]).toEqual([file, []]);
    });
  });

  it('has no raw fontSize literal and no serif family', () => {
    sources.forEach(({file, text}) => {
      expect([file, text.match(/fontSize:\s*[0-9.]+/g) ?? []]).toEqual([file, []]);
      expect([file, /fontFamily:\s*'serif'/.test(text)]).toEqual([file, false]);
    });
  });

  it('does not import React Native Paper, a second icon library or any feature / screen / navigation module', () => {
    sources.forEach(({file, text}) => {
      expect([file, /react-native-paper|material-symbols|@expo\/vector-icons/.test(text)]).toEqual([file, false]);
      expect([file, /from '\.\.\/\.\.\/(screens|navigation|services|state|i18n)\b/.test(text)]).toEqual([file, false]);
    });
  });
});

// Phase 2 asserted that NO file imported these components; Phase 3 adopted them in a two-screen pilot. The DESIGN.md
// migration adopts them application-wide, so the guard now limits WHO may import them instead of which screens: only
// presentation code (screens/ and components/), never services, state, navigation or utilities.
const PILOT_SCREENS = ['screens/NameOnboardingScreen.tsx', 'screens/WelcomeScreen.tsx'];

describe('adoption is limited to presentation code', () => {
  const importers = walk(SRC_DIR)
    .filter(file => /\.tsx?$/.test(file))
    .filter(file => !file.startsWith(UI_DIR + path.sep))
    .filter(file => !file.includes(`${path.sep}__tests__${path.sep}`))
    .filter(file => /from '[^']*components\/ui(\/[^']*)?'|from '\.\/ui(\/[^']*)?'|from '\.\.\/ui(\/[^']*)?'/.test(fs.readFileSync(file, 'utf8')))
    .map(file => path.relative(SRC_DIR, file).split(path.sep).join('/'))
    .sort();

  it('is imported by screens and components only (no service, state, navigation or util module)', () => {
    expect(importers.filter(file => !/^(screens|components)\//.test(file))).toEqual([]);
  });

  it('still includes the two pilot screens', () => {
    PILOT_SCREENS.forEach(screen => expect(importers).toContain(screen));
  });
});
