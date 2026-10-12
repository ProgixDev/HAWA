import {readFileSync} from 'fs';
import {join} from 'path';

// Contract for the isolated audit build (debug => com.hawa.audit, installed BESIDE production com.hawa). It reads the
// Gradle/manifest text because nothing else can prove, without a device, that the audit app can never share a package
// (data directory, Keystore keys, channels, alarms) with the production app.
const ANDROID_APP = join(__dirname, '..', '..', '..', 'android', 'app');
const buildGradle = readFileSync(join(ANDROID_APP, 'build.gradle'), 'utf8');
const mainManifest = readFileSync(join(ANDROID_APP, 'src', 'main', 'AndroidManifest.xml'), 'utf8');
const debugStrings = readFileSync(join(ANDROID_APP, 'src', 'debug', 'res', 'values', 'strings.xml'), 'utf8');

// The `buildTypes` block, split at the `release {` header.
const buildTypes = buildGradle.slice(buildGradle.indexOf('buildTypes {'));
const releaseStart = buildTypes.search(/\n\s*release\s*\{/);

describe('isolated audit build variant', () => {
  const debugType = buildTypes.slice(0, releaseStart);
  const releaseType = buildTypes.slice(releaseStart);

  it('gives the debug build type its own application id suffix', () => {
    expect(releaseStart).toBeGreaterThan(0);
    expect(debugType).toMatch(/applicationIdSuffix\s+"\.audit"/);
  });

  it('keeps the production application id and never suffixes the release build type', () => {
    expect(buildGradle).toMatch(/defaultConfig\s*\{[^}]*applicationId\s+"com\.hawa"/);
    expect(releaseType).not.toMatch(/applicationIdSuffix/);
  });

  it('keeps the Kotlin namespace so component and launch-class names do not move', () => {
    expect(buildGradle).toMatch(/namespace\s+"com\.hawa"/);
  });

  it('shares no user id or process with another app and never allows backup', () => {
    expect(mainManifest).not.toMatch(/sharedUserId|android:process=/);
    expect(mainManifest).toMatch(/android:allowBackup="false"/);
  });

  it('declares the reminder receiver and service as non-exported (no cross-app trigger)', () => {
    expect(mainManifest).toMatch(/AwaReminderRescheduleReceiver"[^>]*android:exported="false"/s);
    expect(mainManifest).toMatch(/AwaReminderRescheduleService"[^>]*android:exported="false"/s);
  });

  it('bundles JS into the debug build so headless delivery works without Metro', () => {
    expect(buildGradle).toMatch(/^\s*debuggableVariants\s*=\s*\[\]/m);
  });

  it('gives the audit app a distinguishable launcher name', () => {
    expect(debugStrings).toMatch(/name="app_name">AWA Audit</);
  });
});
