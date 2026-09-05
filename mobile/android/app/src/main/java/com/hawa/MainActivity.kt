package com.hawa

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Draw the React Native surface behind the system navigation area so the
    // application's own light background remains visible behind 3-button and
    // gesture navigation. Android 15 enforces edge-to-edge for targetSdk 35;
    // applying it explicitly keeps the behavior consistent on older versions.
    WindowCompat.setDecorFitsSystemWindows(window, false)
    window.navigationBarColor = Color.TRANSPARENT

    // Android 10+ otherwise adds an automatic gray contrast scrim even when
    // navigationBarColor is transparent.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.isNavigationBarContrastEnforced = false
    }

    // The application background is light, so keep the system buttons dark.
    WindowInsetsControllerCompat(window, window.decorView)
        .isAppearanceLightNavigationBars = true
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "HAWA"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
