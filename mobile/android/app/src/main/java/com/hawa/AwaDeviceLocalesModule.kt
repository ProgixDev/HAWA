package com.hawa

import android.content.res.Resources
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

/**
 * Read-only bridge that returns the phone's preferred languages, most preferred first, as BCP-47 tags
 * ("fr-DZ", "ar-DZ", "zh-Hans-CN"). React Native itself only exposes the single primary locale, but a user whose phone is
 * set to Arabic first and French second must get French in AWA (the first language AWA supports), so the whole ordered
 * list from Settings -> Languages is needed. See src/utils/deviceLanguage.ts for how it is used and what happens when
 * this module is absent.
 *
 * `Resources.getSystem()` is the system-wide configuration, so the list is always the phone's current setting (not an
 * app-level override) and is read fresh on every call, which is what lets AWA follow a language change when the app
 * comes back to the foreground. Nothing is stored or sent anywhere.
 *
 * A plain (non-Turbo) module, registered like DiscreetLauncherModule (see DiscreetLauncherPackage.kt for why).
 */
@ReactModule(name = AwaDeviceLocalesModule.NAME)
class AwaDeviceLocalesModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun getPreferredLocales(promise: Promise) {
    try {
      val tags = Arguments.createArray()
      // minSdkVersion is 24, so Configuration.getLocales() (a LocaleList, API 24) is always available.
      val locales = Resources.getSystem().configuration.locales
      for (index in 0 until locales.size()) {
        tags.pushString(locales.get(index).toLanguageTag())
      }
      promise.resolve(tags)
    } catch (error: Exception) {
      promise.reject("E_DEVICE_LOCALES", error)
    }
  }

  companion object {
    const val NAME = "AwaDeviceLocales"
  }
}
