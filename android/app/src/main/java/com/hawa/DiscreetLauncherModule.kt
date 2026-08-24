package com.hawa

import android.content.ComponentName
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

/**
 * Minimal native bridge backing AWA's "Apparence discrète" (discreet
 * launcher identity) feature — see DiscreetLauncherScreen.tsx and
 * AndroidManifest.xml's two <activity-alias> entries (LauncherAwa /
 * LauncherDiscreet), both targeting the same MainActivity. Package identity,
 * app data, and deep links are entirely unaffected by this module — it only
 * ever toggles which of the two manifest-declared launcher entry points is
 * enabled, via the standard PackageManager component-enabled API on this
 * app's own components (no special permission required for that).
 *
 * A plain (non-Turbo) module — see DiscreetLauncherPackage.kt's class doc
 * for the real-device-confirmed reason: marking this a TurboModule caused
 * BaseReactPackage's legacy-registry path to skip it entirely under this
 * project's New Architecture config, leaving NativeModules.DiscreetLauncher
 * undefined in JS. Registered via a plain ReactModuleInfo (isTurboModule =
 * false), which is what's actually observed to resolve on-device.
 */
@ReactModule(name = DiscreetLauncherModule.NAME)
class DiscreetLauncherModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  // Manifest-declared default enabled state for each alias — used to
  // interpret COMPONENT_ENABLED_STATE_DEFAULT correctly. DEFAULT means
  // "whatever AndroidManifest.xml's android:enabled says for this
  // component," never "inactive." Keep these literally in sync with
  // AndroidManifest.xml's LauncherAwa (enabled="true") / LauncherDiscreet
  // (enabled="false").
  private val manifestDefaultEnabled =
      mapOf(
          LAUNCHER_AWA to true,
          LAUNCHER_DISCREET to false,
      )

  private fun componentName(componentClassName: String): ComponentName =
      ComponentName(reactApplicationContext.packageName, componentClassName)

  /** One-line device/environment fingerprint attached to every failure log —
   * this is exactly the evidence needed to tell "our code is wrong" apart
   * from "this OEM's PackageManager fork restricts this call for this
   * calling context," without guessing from the shell-UID adb behavior
   * alone (shell UID and app UID are genuinely different callers to
   * PackageManagerService, including on OEM forks like Huawei's
   * HwPackageManagerService). */
  private fun deviceFingerprint(): String =
      "manufacturer=${Build.MANUFACTURER} model=${Build.MODEL} sdkInt=${Build.VERSION.SDK_INT} " +
          "callingPackage=${reactApplicationContext.packageName}"

  /** Human-readable form of getComponentEnabledSetting's raw int, for
   * diagnostics only — never used for branching logic (see isEnabled()). */
  private fun describeEnabledSetting(component: ComponentName): String =
      when (reactApplicationContext.packageManager.getComponentEnabledSetting(component)) {
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> "ENABLED"
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED -> "DISABLED"
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED_USER -> "DISABLED_USER"
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED_UNTIL_USED -> "DISABLED_UNTIL_USED"
        else -> "DEFAULT"
      }

  /** True only if PackageManager can resolve this exact component in the
   * CURRENTLY INSTALLED package — the real, verifiable precondition before
   * ever touching setComponentEnabledSetting for it.
   *
   * MATCH_DISABLED_COMPONENTS is required here — real-device evidence (a
   * Huawei/EMUI test device) showed a plain getActivityInfo(component, 0)
   * call throwing NameNotFoundException for LauncherDiscreet for no reason
   * other than its manifest-declared android:enabled="false". A disabled
   * component is expected, normal state for the currently-inactive alias
   * (see manifestDefaultEnabled above) — it is NOT evidence the component
   * doesn't exist, and must never be conflated with a genuine missing
   * component. Available unconditionally: MATCH_DISABLED_COMPONENTS was
   * introduced in API 24, and this project's minSdk is already 24. */
  private fun componentExists(componentClassName: String): Boolean {
    val component = componentName(componentClassName)
    return try {
      reactApplicationContext.packageManager.getActivityInfo(component, PackageManager.MATCH_DISABLED_COMPONENTS)
      Log.d(
          TAG,
          "componentExists($component) = true — manifestDefaultEnabled=${manifestDefaultEnabled[componentClassName]}, " +
              "overrideState=${describeEnabledSetting(component)}, effectiveEnabled=${isEnabled(componentClassName)}",
      )
      true
    } catch (error: PackageManager.NameNotFoundException) {
      // A genuine miss now — MATCH_DISABLED_COMPONENTS already ruled out
      // "exists but disabled" above, so this means the component is truly
      // absent from the installed package's manifest.
      Log.w(TAG, "Component genuinely not found in installed package (checked with MATCH_DISABLED_COMPONENTS): $component", error)
      false
    }
  }

  private fun setEnabled(componentClassName: String, enabled: Boolean) {
    val packageManager = reactApplicationContext.packageManager
    val component = componentName(componentClassName)
    val newState =
        if (enabled) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
    Log.d(TAG, "setComponentEnabledSetting($component, enabled=$enabled)")
    packageManager.setComponentEnabledSetting(component, newState, PackageManager.DONT_KILL_APP)
  }

  private fun isEnabled(componentClassName: String): Boolean {
    val packageManager = reactApplicationContext.packageManager
    val component = componentName(componentClassName)
    return when (packageManager.getComponentEnabledSetting(component)) {
      PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
      PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
      PackageManager.COMPONENT_ENABLED_STATE_DISABLED_USER,
      PackageManager.COMPONENT_ENABLED_STATE_DISABLED_UNTIL_USED -> false
      // COMPONENT_ENABLED_STATE_DEFAULT (0) — fall back to the real
      // manifest-declared default for THIS component, never a blanket
      // assumption that DEFAULT means disabled.
      else -> manifestDefaultEnabled[componentClassName] ?: false
    }
  }

  /** Reflects the REAL current PackageManager state — read at Privacy
   * screen mount so the UI never has to assume/cache a selection that could
   * drift from what Android actually has enabled. */
  @ReactMethod
  fun getCurrentIdentity(promise: Promise) {
    try {
      promise.resolve(if (isEnabled(LAUNCHER_DISCREET)) DISCREET else AWA)
    } catch (error: SecurityException) {
      Log.e(TAG, "getCurrentIdentity: SecurityException reading component state — ${deviceFingerprint()}", error)
      promise.reject(ERROR_SECURITY_EXCEPTION, "${error.javaClass.simpleName}: ${error.message} (${deviceFingerprint()})", error)
    } catch (error: Exception) {
      Log.e(TAG, "getCurrentIdentity failed — ${deviceFingerprint()}", error)
      promise.reject(ERROR_READ_FAILED, "${error.javaClass.simpleName}: ${error.message}", error)
    }
  }

  /**
   * Switches to exactly one identity, following a strict, verify-before-
   * mutate order so a failure at any step can never leave BOTH aliases
   * disabled (which would leave the app with no launcher icon at all):
   *
   *   1. Verify BOTH the target and previous aliases actually exist in the
   *      installed package (componentExists() correctly treats "exists but
   *      disabled" as existing — see its doc comment).
   *   2. Enable the target alias.
   *   3. Verify the target alias is now actually enabled.
   *   4. Only then disable the previous alias.
   *
   * If step 1 or 3 fails, the method rejects immediately WITHOUT ever
   * touching the previous alias — the original identity is left fully
   * intact and working. DONT_KILL_APP is used throughout so this call never
   * tears down the running JS session; the actual icon/name refresh on the
   * home screen may still be delayed by the device launcher's own icon
   * cache — this module cannot force that refresh.
   */
  @ReactMethod
  fun setIdentity(identity: String, promise: Promise) {
    val target: String
    val previous: String
    when (identity) {
      DISCREET -> {
        target = LAUNCHER_DISCREET
        previous = LAUNCHER_AWA
      }
      AWA -> {
        target = LAUNCHER_AWA
        previous = LAUNCHER_DISCREET
      }
      else -> {
        promise.reject(ERROR_INVALID_IDENTITY, "Unknown identity: $identity")
        return
      }
    }

    try {
      if (!componentExists(target)) {
        promise.reject(
            ERROR_COMPONENT_NOT_FOUND,
            "Target launcher component not found in the installed package's manifest: " +
                "${componentName(target)}. This alias is genuinely absent (checked with " +
                "MATCH_DISABLED_COMPONENTS, so a merely-disabled alias would NOT trigger this) — " +
                "verify AndroidManifest.xml still declares it and that the app was rebuilt with " +
                "that change.",
        )
        return
      }

      // The previous (currently active) alias must also be re-verified —
      // it is expected to exist and be enabled, but this call must never
      // assume that and skip straight to mutating state.
      if (!componentExists(previous)) {
        promise.reject(
            ERROR_COMPONENT_NOT_FOUND,
            "Previous launcher component not found in the installed package's manifest: " +
                "${componentName(previous)}. Aborting before any state change — neither alias was " +
                "touched.",
        )
        return
      }

      setEnabled(target, true)

      if (!isEnabled(target)) {
        promise.reject(
            ERROR_VERIFY_FAILED,
            "Target launcher component ${componentName(target)} did not report enabled after " +
                "setComponentEnabledSetting — the previous identity (${componentName(previous)}) was " +
                "left untouched.",
        )
        return
      }

      setEnabled(previous, false)
      promise.resolve(null)
    } catch (error: SecurityException) {
      // This is the exact case reported from a real Huawei/EMUI device:
      // `adb shell pm enable/disable` fails there with a SecurityException
      // from com.android.server.pm.HwPackageManagerService — but shell UID
      // and this app's own UID are different callers to PackageManager, so
      // that shell failure does NOT by itself prove the in-app call (this
      // exact catch block) also fails on that device/OEM fork. Logged with
      // full device/component context specifically so that question can be
      // answered from real logcat output instead of guessed.
      val message =
          "SecurityException while enabling=${componentName(target)}, disabling=${componentName(previous)} " +
              "— ${deviceFingerprint()} — ${error.message}"
      Log.e(TAG, message, error)
      promise.reject(ERROR_SECURITY_EXCEPTION, message, error)
    } catch (error: Exception) {
      Log.e(
          TAG,
          "setIdentity($identity) failed — enabling=${componentName(target)}, disabling=${componentName(previous)}, ${deviceFingerprint()}",
          error,
      )
      promise.reject(
          ERROR_SWITCH_FAILED,
          "${error.javaClass.simpleName}: ${error.message ?: "no message"} " +
              "(enable=${componentName(target)}, disable=${componentName(previous)}, ${deviceFingerprint()})",
          error,
      )
    }
  }

  companion object {
    const val NAME = "DiscreetLauncher"
    private const val TAG = "DiscreetLauncher"
    private const val AWA = "awa"
    private const val DISCREET = "discreet"
    private const val LAUNCHER_AWA = "com.hawa.LauncherAwa"
    private const val LAUNCHER_DISCREET = "com.hawa.LauncherDiscreet"
    private const val ERROR_READ_FAILED = "DISCREET_LAUNCHER_READ_FAILED"
    private const val ERROR_INVALID_IDENTITY = "DISCREET_LAUNCHER_INVALID_IDENTITY"
    private const val ERROR_COMPONENT_NOT_FOUND = "DISCREET_LAUNCHER_COMPONENT_NOT_FOUND"
    private const val ERROR_VERIFY_FAILED = "DISCREET_LAUNCHER_VERIFY_FAILED"
    private const val ERROR_SWITCH_FAILED = "DISCREET_LAUNCHER_SWITCH_FAILED"
    // Stable code the JS layer checks for explicitly to show an honest
    // "this phone's launcher/OEM restricts this" message instead of the
    // generic failure copy — see DiscreetLauncherScreen.tsx.
    const val ERROR_SECURITY_EXCEPTION = "DISCREET_LAUNCHER_SECURITY_EXCEPTION"
  }
}
