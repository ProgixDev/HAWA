#!/usr/bin/env node
// Design-system coverage inventory (read-only analysis of src/; writes only the two manifest files below).
//
//   node scripts/design-system-inventory.js            -> (re)generates docs/design-system/COVERAGE.json and COVERAGE.md
//   node scripts/design-system-inventory.js --check    -> exits 1 when the committed manifest no longer lists exactly
//                                                          the screens / components / navigators found on disk
//
// The manifest is the matrix "screen -> components -> tokens -> tests -> status" required by AWA_DESIGN_SYSTEM.md.
// Hand-maintained fields (status, batch, notes, exception) survive regeneration; every measured field is recomputed.
// Output is deterministic (sorted, no timestamps) so a diff only shows real changes.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const MANIFEST_JSON = path.join(ROOT, 'docs', 'design-system', 'COVERAGE.json');
const MANIFEST_MD = path.join(ROOT, 'docs', 'design-system', 'COVERAGE.md');
const SCAN_DIRS = ['screens', 'components', 'navigation'];
const STATUSES = ['not-started', 'tokens', 'migrated', 'exception'];
const STATUS_DEFINITIONS = {
  'not-started': 'The file uses its own literals (colours, font sizes, radii) and no design-system token or shared component.',
  tokens: 'The file reads the Phase 1 token modules (useAwaTokens, typescale, shapes, roles …) but still renders its own controls.',
  migrated: 'The file uses the shared src/components/ui components and has no raw hex / fontSize / borderRadius / serif literal beyond its recorded migratedBaseline and its documented exceptions.',
  exception: 'The file deliberately keeps its own styling (brand asset, native dialog, calibrated layout); the reason is mandatory and listed in EXCEPTIONS.md.',
};

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') {continue;}
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {walk(full, out);}
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {out.push(full);}
  }
}

const rel = file => path.relative(ROOT, file).split(path.sep).join('/');
const count = (text, re) => (text.match(re) || []).length;

function moduleOf(relativePath) {
  const parts = relativePath.split('/'); // src/<area>/<module?>/<file>
  if (parts.length <= 3) {return `${parts[1]}:root`;}
  return `${parts[1]}:${parts[2]}`;
}

function kindOf(relativePath, text) {
  const base = path.basename(relativePath, path.extname(relativePath));
  if (relativePath.startsWith('src/navigation/')) {return 'navigator';}
  if (/Sheet/.test(base)) {return 'sheet';}
  if (/Dialog/.test(base)) {return 'dialog';}
  if (/Toast/.test(base)) {return 'toast';}
  if (/<Modal\b/.test(text)) {return 'modal-host';}
  if (relativePath.startsWith('src/screens/') && /Screen/.test(base)) {return 'screen';}
  if (relativePath.startsWith('src/screens/')) {return 'screen-module';}
  return 'component';
}

function metricsOf(text) {
  const nonComment = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return {
    lines: text.split('\n').length,
    usesAwaTheme: /useAwaTheme\b|useAwaTokens\b/.test(nonComment),
    hexLiterals: count(nonComment, /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g),
    rgbaLiterals: count(nonComment, /rgba?\(/g),
    fontSizeLiterals: count(nonComment, /fontSize:\s*[0-9.]+/g),
    fontSizeBelow11: (nonComment.match(/fontSize:\s*[0-9.]+/g) || []).filter(m => parseFloat(m.replace(/[^0-9.]/g, '')) < 11).length,
    borderRadiusLiterals: count(nonComment, /borderRadius:\s*[0-9]+/g),
    serifTitles: count(nonComment, /fontFamily:\s*'serif'/g),
    icons: count(nonComment, /<MaterialDesignIcons\b/g),
    modals: count(nonComment, /<Modal\b/g),
    alerts: count(nonComment, /Alert\.alert\(/g),
    textInputs: count(nonComment, /<TextInput\b/g),
    switches: count(nonComment, /<Switch\b/g),
    gradients: count(nonComment, /<LinearGradient\b/g),
    keyboardAvoiding: count(nonComment, /KeyboardAvoidingView/g),
    states: [
      /ActivityIndicator|isLoading|loading/i.test(nonComment) ? 'loading' : null,
      /empty|isEmpty|noData/i.test(nonComment) ? 'empty' : null,
      /error|failed|failure|unavailable/i.test(nonComment) ? 'error' : null,
      /disabled/i.test(nonComment) ? 'disabled' : null,
      /permission|denied|blocked/i.test(nonComment) ? 'permission' : null,
    ].filter(Boolean),
  };
}

// route name -> source file, from <Stack.Screen name="X" component={Y}> / <Tab.Screen ...> and the import statements
function routesOf() {
  const result = [];
  for (const navigator of ['AppNavigator.tsx', 'MainTabNavigator.tsx', 'PartnerMainTabNavigator.tsx']) {
    const file = path.join(SRC, 'navigation', navigator);
    if (!fs.existsSync(file)) {continue;}
    const text = fs.readFileSync(file, 'utf8');
    const imports = {};
    const importRe = /import\s+(?:([A-Za-z0-9_]+)|\{([^}]+)\})\s+from\s+'(\.[^']+)'/g;
    let m;
    while ((m = importRe.exec(text))) {
      const target = path.resolve(path.dirname(file), m[3]);
      const resolved = ['.tsx', '.ts', '/index.tsx', '/index.ts'].map(ext => target + ext).find(candidate => fs.existsSync(candidate));
      if (!resolved) {continue;}
      if (m[1]) {imports[m[1]] = rel(resolved);}
      if (m[2]) {m[2].split(',').forEach(part => {const name = part.trim().split(/\s+as\s+/).pop(); if (name) {imports[name] = rel(resolved);}});}
    }
    const screenRe = /<(?:Stack|Tab)\.Screen\b([\s\S]*?)(?:\/>|<\/(?:Stack|Tab)\.Screen>)/g;
    while ((m = screenRe.exec(text))) {
      const nameMatch = m[1].match(/name=\{?["'`]([A-Za-z0-9_]+)["'`]/);
      const componentMatch = m[1].match(/component=\{([A-Za-z0-9_]+)\}/);
      const childMatch = m[1].match(/<([A-Z][A-Za-z0-9_]+)\b/);
      if (!nameMatch) {continue;}
      const identifier = componentMatch ? componentMatch[1] : childMatch ? childMatch[1] : null;
      let routeFile = identifier ? imports[identifier] || null : null;
      if (!routeFile && identifier) {
        const sibling = path.join(SRC, 'navigation', `${identifier}.tsx`);
        routeFile = fs.existsSync(sibling) ? rel(sibling) : null;
      }
      result.push({navigator: navigator.replace('.tsx', ''), route: nameMatch[1], component: identifier, file: routeFile});
    }
  }
  return result.sort((a, b) => (a.navigator + a.route).localeCompare(b.navigator + b.route));
}

function buildInventory() {
  const files = [];
  for (const dir of SCAN_DIRS) {walk(path.join(SRC, dir), files);}
  files.sort();
  const routes = routesOf();
  const routesByFile = {};
  routes.forEach(r => {if (r.file) {(routesByFile[r.file] = routesByFile[r.file] || []).push(`${r.navigator}:${r.route}`);}});
  const entries = files.map(file => {
    const text = fs.readFileSync(file, 'utf8');
    const relativePath = rel(file);
    return {
      path: relativePath,
      module: moduleOf(relativePath),
      kind: kindOf(relativePath, text),
      routes: routesByFile[relativePath] || [],
      ...metricsOf(text),
    };
  });
  return {entries, routes};
}

function readExisting() {
  if (!fs.existsSync(MANIFEST_JSON)) {return {};}
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_JSON, 'utf8'));
    return Object.fromEntries((parsed.files || []).map(file => [file.path, file]));
  } catch {
    return {};
  }
}

function build() {
  const {entries, routes} = buildInventory();
  const previous = readExisting();
  const files = entries.map(entry => {
    const old = previous[entry.path] || {};
    return {
      ...entry,
      status: STATUSES.includes(old.status) ? old.status : 'not-started',
      batch: old.batch || null,
      exception: old.exception || null,
      notes: old.notes || null,
      // baseline for the ratchet test: only meaningful once status === 'migrated'
      migratedBaseline: old.migratedBaseline || null,
    };
  });
  const totals = {
    files: files.length,
    screens: files.filter(f => f.kind === 'screen').length,
    routes: routes.length,
    sheets: files.filter(f => f.kind === 'sheet').length,
    dialogs: files.filter(f => f.kind === 'dialog').length,
    toasts: files.filter(f => f.kind === 'toast').length,
    modalHosts: files.filter(f => f.modals > 0).length,
    alertSites: files.reduce((n, f) => n + f.alerts, 0),
    hexLiterals: files.reduce((n, f) => n + f.hexLiterals, 0),
    fontSizeLiterals: files.reduce((n, f) => n + f.fontSizeLiterals, 0),
    fontSizeBelow11: files.reduce((n, f) => n + f.fontSizeBelow11, 0),
    borderRadiusLiterals: files.reduce((n, f) => n + f.borderRadiusLiterals, 0),
    serifTitles: files.reduce((n, f) => n + f.serifTitles, 0),
    withoutAwaTheme: files.filter(f => !f.usesAwaTheme).length,
    byStatus: Object.fromEntries(STATUSES.map(s => [s, files.filter(f => f.status === s).length])),
  };
  return {
    description: 'AWA design-system coverage matrix. Measured fields are generated by scripts/design-system-inventory.js; status / batch / exception / notes / migratedBaseline are maintained by hand.',
    statuses: STATUSES,
    statusDefinitions: STATUS_DEFINITIONS,
    totals,
    routes,
    files,
  };
}

function markdown(manifest) {
  const byModule = {};
  manifest.files.forEach(f => {(byModule[f.module] = byModule[f.module] || []).push(f);});
  const lines = [
    '# AWA design-system coverage matrix',
    '',
    'Generated by `scripts/design-system-inventory.js` from the repository (do not edit the measured columns by hand).',
    'The full per-file matrix, including routes and states, is `COVERAGE.json`.',
    '',
    '## Totals',
    '',
    '| Metric | Value |',
    '|---|---:|',
    ...Object.entries(manifest.totals)
      .filter(([, v]) => typeof v === 'number')
      .map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '## Status definitions',
    '',
    ...Object.entries(STATUS_DEFINITIONS).map(([k, v]) => `- **${k}** — ${v}`),
    '',
    '## Status',
    '',
    '| Status | Files |',
    '|---|---:|',
    ...Object.entries(manifest.totals.byStatus).map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '## By module',
    '',
    '| Module | Files | Routes | hex | fontSize | fontSize < 11 | radius | serif | no useAwaTheme |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ];
  Object.keys(byModule).sort().forEach(module => {
    const list = byModule[module];
    const sum = key => list.reduce((n, f) => n + f[key], 0);
    lines.push(
      `| ${module} | ${list.length} | ${list.reduce((n, f) => n + f.routes.length, 0)} | ${sum('hexLiterals')} | ${sum('fontSizeLiterals')} | ${sum('fontSizeBelow11')} | ${sum('borderRadiusLiterals')} | ${sum('serifTitles')} | ${list.filter(f => !f.usesAwaTheme).length} |`,
    );
  });
  lines.push('', '## Routes', '', '| Navigator | Route | File |', '|---|---|---|');
  manifest.routes.forEach(r => lines.push(`| ${r.navigator} | ${r.route} | ${r.file || '(inline / unresolved)'} |`));
  lines.push('');
  return lines.join('\n');
}

if (require.main === module) {
  const manifest = build();
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(MANIFEST_JSON)) {console.error('COVERAGE.json is missing'); process.exit(1);}
    const committed = JSON.parse(fs.readFileSync(MANIFEST_JSON, 'utf8')).files.map(f => f.path).sort();
    const live = manifest.files.map(f => f.path).sort();
    const missing = live.filter(p => !committed.includes(p));
    const stale = committed.filter(p => !live.includes(p));
    if (missing.length || stale.length) {
      console.error(`manifest out of date: ${missing.length} unlisted, ${stale.length} stale`);
      missing.slice(0, 20).forEach(p => console.error('  + ' + p));
      stale.slice(0, 20).forEach(p => console.error('  - ' + p));
      process.exit(1);
    }
    console.log(`manifest lists all ${live.length} files`);
  } else {
    fs.writeFileSync(MANIFEST_JSON, `${JSON.stringify(manifest, null, 1)}\n`, 'utf8');
    fs.writeFileSync(MANIFEST_MD, markdown(manifest), 'utf8');
    console.log(`wrote ${rel(MANIFEST_JSON)} and ${rel(MANIFEST_MD)}: ${manifest.totals.files} files, ${manifest.totals.routes} routes`);
  }
}

module.exports = {build, buildInventory, STATUSES, SCAN_DIRS};
