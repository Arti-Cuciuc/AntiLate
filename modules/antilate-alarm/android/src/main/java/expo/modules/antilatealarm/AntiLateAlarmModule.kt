package expo.modules.antilatealarm

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AntiLateAlarmModule : Module() {
  private val context: Context?
    get() = appContext.reactContext

  private fun getVibrator(): Vibrator? {
    val currentContext = context ?: return null

    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      currentContext
        .getSystemService(VibratorManager::class.java)
        ?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      currentContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
  }

  override fun definition() = ModuleDefinition {
    Name("AntiLateAlarm")

    Function("hasVibrator") {
      getVibrator()?.hasVibrator() == true
    }

    Function("canUseFullScreenIntent") {
      val currentContext = context ?: return@Function false

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        return@Function true
      }

      val notificationManager =
        currentContext.getSystemService(NotificationManager::class.java)

      notificationManager?.canUseFullScreenIntent() == true
    }

    AsyncFunction("openFullScreenIntentSettings") {
      val currentContext = context ?: return@AsyncFunction null

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val intent = Intent(
          Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
          Uri.parse("package:${currentContext.packageName}")
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

        currentContext.startActivity(intent)
      }

      null
    }

    Function("startAlarmVibration") {
      val vibrator = getVibrator() ?: return@Function false

      if (!vibrator.hasVibrator()) {
        return@Function false
      }

      val timings = longArrayOf(0, 850, 160, 850, 160, 1_150, 260)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val amplitudes = intArrayOf(0, 255, 0, 255, 0, 255, 0)
        vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, 1))
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(timings, 1)
      }

      true
    }

    Function("stopAlarmVibration") {
      getVibrator()?.cancel()
    }
  }
}
