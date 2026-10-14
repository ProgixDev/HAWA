import {existsSync, readdirSync, readFileSync} from 'fs';
import {join} from 'path';

// Contract for the development build (dev => com.hawa.dev): Metro + Fast Refresh for daily UI work, installed BESIDE
// production (com.hawa), the audit build (com.hawa.audit) and the pilot (com.hawa.pilot). Like the audit and pilot guards
// it reads Gradle / manifest / resource text, because nothing else can prove, without a device, that the dev app can
// never share a package (data directory, Keystore keys, channels, alarms, provider authorities) with another app, that
// only the dev variant loses its embedded JS bundle, and that the other variants did not move.
const ANDROID = join(__dirname, '..', '..', '..', 'android');
const APP = join(ANDROID, 'app');
const read = (...parts: string[]) => readFileSync(join(APP, ...parts), 'utf8');

// Comment lines removed, so braces or words inside a comment cannot move a block boundary.
const gradle = read('build.gradle').replace(/^\s*\/\/.*$/gm, '');
const buildTypes = gradle.slice(gradle.indexOf('buildTypes {'));

/** The `{ ... }` body of a named block (brace matched), searched from the start of `source`. */
function blockOf(source: string, name: string): string {
  const header = new RegExp(`\\n\\s*${name}\\s*\\{`).exec(source);
  if (!header) {throw new Error(`no "${name} {" block`);}
  const open = header.index + header[0].length - 1;
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') {depth += 1;}
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {return source.slice(open, index + 1);}
    }
  }
  throw new Error(`unbalanced "${name} {" block`);
}

/** The variants named in `debuggableVariants = [...]` (lower-cased, the plugin compares case-insensitively). */
function debuggableVariants(): string[] {
  const listed = /^\s*debuggableVariants\s*=\s*\[([^\]]*)\]/m.exec(gradle);
  if (!listed) {throw new Error('no debuggableVariants list');}
  return listed[1]
    .split(',')
    .map(variant => variant.trim().replace(/^["']|["']$/g, '').toLowerCase())
    .filter(Boolean);
}

describe('development build variant (Metro + Fast Refresh)', () => {
  const debug = blockOf(buildTypes, 'debug');
  const dev = blockOf(buildTypes, 'dev');
  const pilot = blockOf(buildTypes, 'pilot');
  const release = blockOf(buildTypes, 'release');

  it('has its own build type: application id suffix .dev, debuggable, debug signing, debug libraries', () => {
    expect(dev).toMatch(/applicationIdSuffix\s+"\.dev"/);
    expect(dev).toMatch(/versionNameSuffix\s+"-dev"/);
    expect(dev).toMatch(/debuggable\s+true/);
    expect(dev).toMatch(/signingConfig\s+signingConfigs\.debug/);
    expect(dev).toMatch(/matchingFallbacks\s*=\s*\['debug'\]/);
    expect(dev).not.toMatch(/\.audit|-audit|\.pilot|-pilot/);
  });

  it('is the ONLY variant without an embedded JS bundle (it always loads JavaScript from Metro)', () => {
    expect(debuggableVariants()).toEqual(['dev']);
  });

  it('uses the default Metro port 8081: no dev-server port or host override anywhere', () => {
    expect(readFileSync(join(ANDROID, 'gradle.properties'), 'utf8')).not.toMatch(/reactNativeDevServerPort|reactNativeInspectorProxyPort/);
    ['main', 'debug', 'dev', 'pilot'].forEach(set => {
      const values = join(APP, 'src', set, 'res', 'values');
      if (!existsSync(values)) {return;}
      readdirSync(values).forEach(file => {
        expect([set, file, /dev_server_port|debug_http_host|react_native_dev_server/.test(readFileSync(join(values, file), 'utf8'))]).toEqual([set, file, false]);
      });
    });
  });

  it('allows cleartext HTTP only for the development and audit variants (Metro is served over HTTP)', () => {
    expect(read('src', 'dev', 'AndroidManifest.xml')).toMatch(/android:usesCleartextTraffic="true"/);
    expect(read('src', 'debug', 'AndroidManifest.xml')).toMatch(/android:usesCleartextTraffic="true"/); // unchanged, audit
    expect(read('src', 'main', 'AndroidManifest.xml')).not.toMatch(/usesCleartextTraffic/);
    expect(existsSync(join(APP, 'src', 'pilot', 'AndroidManifest.xml'))).toBe(false);
    expect(existsSync(join(APP, 'src', 'release'))).toBe(false);
  });

  it('gives the dev app a launcher name distinct from production, audit and pilot', () => {
    const name = (xml: string) => /name="app_name">([^<]*)</.exec(xml)?.[1];
    const names = [
      name(read('src', 'main', 'res', 'values', 'strings.xml')),
      name(read('src', 'debug', 'res', 'values', 'strings.xml')),
      name(read('src', 'pilot', 'res', 'values', 'strings.xml')),
      name(read('src', 'dev', 'res', 'values', 'strings.xml')),
    ];
    expect(names).toEqual(['AWA', 'AWA Audit', 'AWA Pilot', 'AWA Dev']);
    expect(new Set(names).size).toBe(4);
    expect(read('src', 'dev', 'res', 'values', 'strings.xml')).toMatch(/name="app_name_discreet">AWA Dev</);
  });

  it('adds nothing to the dev source set besides the cleartext overlay and the launcher strings', () => {
    const root = join(APP, 'src', 'dev');
    expect(readdirSync(root).sort()).toEqual(['AndroidManifest.xml', 'res']);
    expect(readdirSync(join(root, 'res'))).toEqual(['values']);
    expect(readdirSync(join(root, 'res', 'values'))).toEqual(['strings.xml']);
    // identity is never declared by hand in the overlay: no provider authority, permission, shared user id or process
    expect(read('src', 'dev', 'AndroidManifest.xml')).not.toMatch(/<provider|<permission|sharedUserId|android:process|android:authorities|debuggable/);
  });

  it('only a debuggable build connects to Metro: developer support follows BuildConfig.DEBUG and nothing else', () => {
    const application = read('src', 'main', 'java', 'com', 'hawa', 'MainApplication.kt');
    expect(application).toMatch(/getUseDeveloperSupport\(\):\s*Boolean\s*=\s*BuildConfig\.DEBUG/);
  });

  it('leaves the audit, pilot and production configuration exactly as their contracts say', () => {
    expect(debug).toMatch(/applicationIdSuffix\s+"\.audit"/);
    expect(debug).toMatch(/versionNameSuffix\s+"-audit"/);
    expect(debug).not.toMatch(/\bdev\b/);
    expect(pilot).toMatch(/applicationIdSuffix\s+"\.pilot"/);
    expect(pilot).toMatch(/debuggable\s+false/);
    expect(pilot).toMatch(/matchingFallbacks\s*=\s*\['release'\]/);
    expect(pilot).not.toMatch(/\.dev|-dev/);
    expect(release).not.toMatch(/applicationIdSuffix|versionNameSuffix|\.dev|-dev/);
    expect(gradle).toMatch(/defaultConfig\s*\{[^}]*applicationId\s+"com\.hawa"/);
    expect(gradle).toMatch(/defaultConfig\s*\{[^}]*versionCode\s+1\b/);
    expect(gradle).toMatch(/namespace\s+"com\.hawa"/);
  });

  it('keeps the release block the last build type (the audit guard reads everything after it as release)', () => {
    const afterRelease = buildTypes.slice(buildTypes.indexOf(release) + release.length);
    expect(afterRelease).toMatch(/^\s*\}\s*\}/);
  });
});
