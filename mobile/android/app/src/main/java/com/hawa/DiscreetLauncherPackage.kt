package com.hawa

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers DiscreetLauncherModule — see that file for what it does. Not
 * autolinked (it lives inside the app itself, not a separate library), so
 * it's added manually in MainApplication.kt's getPackages(), exactly where
 * that file's own comment says manual packages go.
 *
 * Extends BaseReactPackage so registration is attempted unconditionally
 * (see ReactPackageTurboModuleManagerDelegate.initialize() in the
 * react-native sources: a plain ReactPackage's createNativeModules() is
 * only even inspected when two internal feature flags — bridgeless
 * architecture + legacy module interop — are BOTH enabled).
 *
 * isTurboModule is deliberately `false` here, confirmed necessary by real
 * on-device testing: with it set to `true`, BaseReactPackage.
 * getNativeModuleIterator() (the legacy/NativeModuleRegistryBuilder path)
 * explicitly SKIPS this module whenever ReactNativeNewArchitectureFeatureFlags
 * .useTurboModules() is true (which it is here, since newArchEnabled=true) —
 * and on this real device, `NativeModules.DiscreetLauncher` resolved to
 * `undefined` in JS with that combination: zero Kotlin-side log output ever
 * appeared for either getCurrentIdentity or setIdentity, even though the
 * class was confirmed present in the installed APK's dex. Marking it as a
 * plain (non-turbo) module keeps it in the legacy registry path instead,
 * which real-device logcat confirms is what actually resolves it here.
 */
class DiscreetLauncherPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      if (name == DiscreetLauncherModule.NAME) DiscreetLauncherModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
        DiscreetLauncherModule.NAME to
            ReactModuleInfo(
                DiscreetLauncherModule.NAME,
                DiscreetLauncherModule::class.java.name,
                false, // canOverrideExistingModule
                false, // needsEagerInit
                false, // isCxxModule
                false, // isTurboModule — see class doc above for why
            ))
  }
}
