import fs from 'fs';
import path from 'path';

import {NOTIFICATION_LAUNCH_ACTIVITY} from '../pregnancyNotifications';

// Tapping a reminder must open AWA (Phase 1 repair: F5), and the discreet launcher must keep working.
//
// Jest cannot tap a notification on a phone. What it CAN pin down is the contract that makes the tap work on
// Android, from the files Android actually reads: notifee launches the class named in `launchActivity` with
// Class.forName(), so that name has to be a real Activity CLASS — not an <activity-alias>, which is only a manifest
// entry. AWA's only MAIN/LAUNCHER entries are the two aliases, so notifee's default ("find the launcher Activity")
// resolves to an alias and the tap silently opened nothing. A physical-device tap test is still required.

const ANDROID_APP = path.resolve(__dirname, '../../../android/app');
const manifest = fs.readFileSync(path.join(ANDROID_APP, 'src/main/AndroidManifest.xml'), 'utf8');
const gradle = fs.readFileSync(path.join(ANDROID_APP, 'build.gradle'), 'utf8');
const mainActivityKt = fs.readFileSync(path.join(ANDROID_APP, 'src/main/java/com/hawa/MainActivity.kt'), 'utf8');
const discreetModuleKt = fs.readFileSync(path.join(ANDROID_APP, 'src/main/java/com/hawa/DiscreetLauncherModule.kt'), 'utf8');

const namespace = /namespace\s+["']([^"']+)["']/.exec(gradle)![1];

/** The <activity ...> element whose android:name is exactly `name`. */
function element(tag: 'activity' | 'activity-alias', name: string): string | undefined {
  // An alias has child <intent-filter> elements (which contain self-closing tags), so it only ends at its own
  // closing tag; MainActivity has no children and is self-closing.
  const end = tag === 'activity-alias' ? '</activity-alias>' : '(?:</activity>|/>)';
  const pattern = new RegExp(`<${tag}\\b[^>]*android:name="${name.replace(/\./g, '\\.')}"[\\s\\S]*?${end}`);
  return pattern.exec(manifest)?.[0];
}

const aliasNames = Array.from(manifest.matchAll(/<activity-alias\b[^>]*android:name="([^"]+)"/g)).map(match => match[1]);

describe('the Activity a tapped reminder opens', () => {
  it('is the real MainActivity class: package, class and manifest entry all agree', () => {
    expect(NOTIFICATION_LAUNCH_ACTIVITY).toBe(`${namespace}.MainActivity`);
    expect(mainActivityKt).toMatch(new RegExp(`^package ${namespace.replace(/\./g, '\\.')}\\s*$`, 'm'));
    expect(mainActivityKt).toMatch(/^class MainActivity\b/m);
    expect(element('activity', '.MainActivity')).toBeDefined();
  });

  it('is NOT an activity-alias (Class.forName cannot load an alias, which is why notifee\'s default failed)', () => {
    const fullyQualifiedAliases = aliasNames.map(name => (name.startsWith('.') ? `${namespace}${name}` : name));

    expect(fullyQualifiedAliases.length).toBeGreaterThan(0);
    expect(fullyQualifiedAliases).not.toContain(NOTIFICATION_LAUNCH_ACTIVITY);
  });

  it('explains why it must stay explicit: MainActivity itself has no launcher filter, only the aliases do', () => {
    const mainActivity = element('activity', '.MainActivity')!;
    expect(mainActivity).not.toContain('android.intent.category.LAUNCHER');

    for (const alias of aliasNames) {
      expect(element('activity-alias', alias)).toContain('android.intent.category.LAUNCHER');
    }
  });

  it('can be started from a notification: exported and single-task (an open AWA is brought forward, not duplicated)', () => {
    const mainActivity = element('activity', '.MainActivity')!;
    expect(mainActivity).toContain('android:exported="true"');
    expect(mainActivity).toContain('android:launchMode="singleTask"');
  });
});

describe('the discreet launcher is untouched', () => {
  it('both launcher identities still exist, both target MainActivity, exactly one is enabled by default', () => {
    const awa = element('activity-alias', '.LauncherAwa')!;
    const discreet = element('activity-alias', '.LauncherDiscreet')!;

    expect(awa).toBeDefined();
    expect(discreet).toBeDefined();
    expect(awa).toContain('android:targetActivity=".MainActivity"');
    expect(discreet).toContain('android:targetActivity=".MainActivity"');
    expect(awa).toContain('android:enabled="true"');
    expect(discreet).toContain('android:enabled="false"');
  });

  it('the native module that switches between them is still wired to those same aliases', () => {
    expect(discreetModuleKt).toContain('LAUNCHER_AWA');
    expect(discreetModuleKt).toContain('LAUNCHER_DISCREET');
    expect(discreetModuleKt).toContain('setComponentEnabledSetting');
  });

  it('opening MainActivity directly cannot bypass the app lock or privacy cover: both live in JS (App.tsx), not in the launcher', () => {
    const appSource = fs.readFileSync(path.resolve(__dirname, '../../../App.tsx'), 'utf8');

    expect(appSource).toContain('AppLockScreen');
    expect(appSource).toContain('PrivacyCover');
  });
});
