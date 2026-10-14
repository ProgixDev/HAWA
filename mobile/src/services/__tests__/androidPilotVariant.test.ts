import {existsSync, readdirSync, readFileSync} from 'fs';
import {join} from 'path';

// Contract for the isolated pilot build (pilot => com.hawa.pilot, a release-like variant installed BESIDE production
// com.hawa and the audit build com.hawa.audit, used for the Design System device review of the first-run screens). Like
// androidAuditVariant.test.ts it reads the Gradle / resource text, because nothing else can prove, without a device,
// that the pilot can never share a package (data directory, Keystore keys, channels, alarms) with another app, and that
// adding it did not move the audit or production configuration.
const ANDROID_APP = join(__dirname, '..', '..', '..', 'android', 'app');
const read = (...parts: string[]) => readFileSync(join(ANDROID_APP, ...parts), 'utf8');

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

describe('isolated pilot build variant', () => {
  const debug = blockOf(buildTypes, 'debug');
  const pilot = blockOf(buildTypes, 'pilot');
  const release = blockOf(buildTypes, 'release');

  it('has its own build type with a distinct application id suffix and version name suffix', () => {
    expect(pilot).toMatch(/applicationIdSuffix\s+"\.pilot"/);
    expect(pilot).toMatch(/versionNameSuffix\s+"-pilot"/);
    expect(pilot).not.toMatch(/\.audit|-audit/);
  });

  it('is release-like: not debuggable, release signing / minify / proguard, libraries resolved through release', () => {
    expect(pilot).toMatch(/debuggable\s+false/);
    expect(pilot).not.toMatch(/debuggable\s+true/);
    expect(pilot).toMatch(/matchingFallbacks\s*=\s*\['release'\]/);
    expect(pilot).toMatch(/signingConfig\s+signingConfigs\.debug/);
    expect(pilot).toMatch(/minifyEnabled\s+enableProguardInReleaseBuilds/);
    expect(pilot).toMatch(/proguardFiles\s+getDefaultProguardFile\("proguard-android\.txt"\),\s*"proguard-rules\.pro"/);
    // the settings it mirrors really are the release block's
    expect(release).toMatch(/signingConfig\s+signingConfigs\.debug/);
    expect(release).toMatch(/minifyEnabled\s+enableProguardInReleaseBuilds/);
    expect(release).toMatch(/proguardFiles\s+getDefaultProguardFile\("proguard-android\.txt"\),\s*"proguard-rules\.pro"/);
  });

  it('leaves the audit (debug) and production (release) configuration exactly as their contracts say', () => {
    expect(debug).toMatch(/applicationIdSuffix\s+"\.audit"/);
    expect(debug).toMatch(/versionNameSuffix\s+"-audit"/);
    expect(debug).toMatch(/signingConfig\s+signingConfigs\.debug/);
    expect(debug).not.toMatch(/pilot/);
    expect(release).not.toMatch(/applicationIdSuffix|versionNameSuffix|pilot/);
    expect(gradle).toMatch(/defaultConfig\s*\{[^}]*applicationId\s+"com\.hawa"/);
    expect(gradle).toMatch(/defaultConfig\s*\{[^}]*versionCode\s+1\b/);
    expect(gradle).toMatch(/namespace\s+"com\.hawa"/);
    // Only the development variant skips the embedded bundle; the pilot (like debug and release) is NOT listed, so it
    // still carries its own JS bundle. (This was `debuggableVariants = []` before the dev variant existed.)
    const listed = /^\s*debuggableVariants\s*=\s*\[([^\]]*)\]/m.exec(gradle);
    expect(listed).not.toBeNull();
    const variants = (listed as RegExpExecArray)[1]
      .split(',')
      .map(variant => variant.trim().replace(/^["']|["']$/g, '').toLowerCase())
      .filter(Boolean);
    expect(variants).toEqual(['dev']);
    ['debug', 'pilot', 'release'].forEach(name => expect(variants).not.toContain(name));
  });

  it('keeps the release block the last build type (the audit guard reads everything after it as release)', () => {
    const afterRelease = buildTypes.slice(buildTypes.indexOf(release) + release.length);
    expect(afterRelease).toMatch(/^\s*\}\s*\}/); // closes buildTypes, then android: nothing declared after release
  });

  it('gives the pilot a launcher name distinct from production and from the audit build', () => {
    const name = (xml: string) => /name="app_name">([^<]*)</.exec(xml)?.[1];
    const main = read('src', 'main', 'res', 'values', 'strings.xml');
    const audit = read('src', 'debug', 'res', 'values', 'strings.xml');
    const pilotStrings = read('src', 'pilot', 'res', 'values', 'strings.xml');
    expect(name(pilotStrings)).toBe('AWA Pilot');
    expect(pilotStrings).toMatch(/name="app_name_discreet">AWA Pilot</);
    expect(new Set([name(main), name(audit), name(pilotStrings)]).size).toBe(3);
  });

  it('adds nothing to the pilot source set besides the launcher strings (no manifest overlay)', () => {
    const root = join(ANDROID_APP, 'src', 'pilot');
    expect(readdirSync(root)).toEqual(['res']);
    expect(readdirSync(join(root, 'res'))).toEqual(['values']);
    expect(readdirSync(join(root, 'res', 'values'))).toEqual(['strings.xml']);
    expect(existsSync(join(root, 'AndroidManifest.xml'))).toBe(false);
  });

  it('declares no fixed content-provider authority of its own that two installed variants could collide on', () => {
    const mainManifest = read('src', 'main', 'AndroidManifest.xml');
    expect(mainManifest).not.toMatch(/<provider|android:authorities/);
    expect(mainManifest).not.toMatch(/sharedUserId|android:process=/);
  });
});
