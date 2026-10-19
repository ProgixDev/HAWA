package com.hawa

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers AwaDeviceLocalesModule. Added by hand in MainApplication.kt's getPackages() (it lives in the app itself, not
 * in an autolinked library). Registered exactly like DiscreetLauncherPackage: a BaseReactPackage whose module is declared
 * as a plain, non-Turbo module (isTurboModule = false), which is what resolves under this project's New Architecture
 * configuration — see DiscreetLauncherPackage.kt's class doc for the on-device evidence.
 */
class AwaDeviceLocalesPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      if (name == AwaDeviceLocalesModule.NAME) AwaDeviceLocalesModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
        AwaDeviceLocalesModule.NAME to
            ReactModuleInfo(
                AwaDeviceLocalesModule.NAME,
                AwaDeviceLocalesModule::class.java.name,
                false, // canOverrideExistingModule
                false, // needsEagerInit
                false, // isCxxModule
                false, // isTurboModule
            ))
  }
}
