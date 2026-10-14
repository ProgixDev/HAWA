import fs from 'fs';
import path from 'path';

// The coverage manifest (docs/design-system/COVERAGE.json) is the matrix that stops a screen being forgotten in the
// Material 3 migration. It is produced by scripts/design-system-inventory.js; this test keeps it honest:
//   1. every screen / component / navigator file on disk is listed, and nothing stale is listed;
//   2. every route resolves to a listed file;
//   3. ratchet: a file marked `migrated` may never gain raw hex / fontSize / borderRadius / serif literals beyond its
//      recorded baseline (and `exception` entries must say why).
// Regenerate with:  node scripts/design-system-inventory.js

const inventory = require('../../../scripts/design-system-inventory.js') as {
  build: () => {
    files: Array<Record<string, unknown> & {path: string}>;
    routes: Array<{navigator: string; route: string; file: string | null}>;
  };
  STATUSES: string[];
};

const MANIFEST = path.join(__dirname, '..', '..', '..', 'docs', 'design-system', 'COVERAGE.json');
type ManifestFile = {
  path: string;
  status: string;
  batch: string | null;
  exception: string | null;
  hexLiterals: number;
  fontSizeLiterals: number;
  borderRadiusLiterals: number;
  serifTitles: number;
  migratedBaseline: {hexLiterals: number; fontSizeLiterals: number; borderRadiusLiterals: number; serifTitles: number} | null;
};
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as {
  files: ManifestFile[];
  routes: Array<{navigator: string; route: string; file: string | null}>;
  statuses: string[];
};
const live = inventory.build();

describe('design-system coverage manifest', () => {
  it('lists exactly the screens, components, sheets, toasts and navigators found in src/', () => {
    const listed = manifest.files.map(file => file.path).sort();
    const found = live.files.map(file => file.path).sort();
    expect(found.filter(file => !listed.includes(file))).toEqual([]); // a new, unlisted file -> regenerate + triage
    expect(listed.filter(file => !found.includes(file))).toEqual([]); // a deleted / renamed file still listed
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('covers every discovered area (screens, components, navigation) and both navigators’ routes', () => {
    const areas = new Set(manifest.files.map(file => file.path.split('/')[1]));
    expect([...areas].sort()).toEqual(['components', 'navigation', 'screens']);
    expect(manifest.routes.length).toBeGreaterThan(120);
    expect(manifest.routes.filter(route => route.file === null)).toEqual([]);
    const listed = new Set(manifest.files.map(file => file.path));
    manifest.routes.forEach(route => expect([route.route, listed.has(route.file as string)]).toEqual([route.route, true]));
    ['CycleHome', 'Calendar', 'Statistics', 'Profile', 'PartnerHome', 'Welcome', 'Auth', 'ArticleReader'].forEach(name => {
      expect(manifest.routes.some(route => route.route === name)).toBe(true);
    });
  });

  it('every entry has a valid status; exceptions are explained; nothing is marked migrated yet', () => {
    manifest.files.forEach(file => {
      expect(inventory.STATUSES).toContain(file.status);
      if (file.status === 'exception') {
        expect([file.path, Boolean(file.exception)]).toEqual([file.path, true]);
      }
    });
    // Phase 1 / 2 migrated nothing (this used to be `toEqual([])`). Phase 3 pilot batch 1 migrates exactly two screens;
    // every later batch has to change this list on purpose.
    expect(manifest.files.filter(file => file.status === 'migrated').map(file => file.path).sort()).toEqual([
      'src/screens/NameOnboardingScreen.tsx',
      'src/screens/WelcomeScreen.tsx',
    ]);
  });

  it('ratchet: a migrated file never gains raw literals beyond its recorded baseline', () => {
    const liveByPath = new Map(live.files.map(file => [file.path, file]));
    manifest.files
      .filter(file => file.status === 'migrated')
      .forEach(file => {
        const baseline = file.migratedBaseline ?? {hexLiterals: 0, fontSizeLiterals: 0, borderRadiusLiterals: 0, serifTitles: 0};
        const current = liveByPath.get(file.path) as unknown as ManifestFile;
        (['hexLiterals', 'fontSizeLiterals', 'borderRadiusLiterals', 'serifTitles'] as const).forEach(key => {
          expect([file.path, key, current[key] <= baseline[key]]).toEqual([file.path, key, true]);
        });
      });
  });
});
