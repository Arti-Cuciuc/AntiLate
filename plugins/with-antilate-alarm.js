const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
} = require('expo/config-plugins');

function withAntiLateAlarm(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    manifestConfig.modResults.manifest.$['xmlns:tools'] =
      'http://schemas.android.com/tools';
    const mainApplication =
      AndroidConfig.Manifest.getMainApplicationOrThrow(
        manifestConfig.modResults,
      );
    const activities = mainApplication.activity ?? [];
    const mainActivity = activities.find((activity) =>
      (activity['intent-filter'] ?? []).some((intentFilter) =>
        (intentFilter.category ?? []).some(
          (category) =>
            category.$?.['android:name'] ===
            'android.intent.category.LAUNCHER',
        ),
      ),
    );

    if (mainActivity) {
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';
    }

    const services = mainApplication.service ?? [];
    let foregroundService = services.find(
      (service) =>
        service.$?.['android:name'] === 'app.notifee.core.ForegroundService',
    );

    if (!foregroundService) {
      foregroundService = {
        $: {
          'android:name': 'app.notifee.core.ForegroundService',
        },
      };
      services.push(foregroundService);
      mainApplication.service = services;
    }

    foregroundService.$['android:foregroundServiceType'] = 'specialUse';
    foregroundService.$['tools:replace'] = 'android:foregroundServiceType';
    foregroundService.property = [
      {
        $: {
          'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
          'android:value': 'user_created_time_critical_departure_alarm',
        },
      },
    ];

    return manifestConfig;
  });
}

module.exports = createRunOncePlugin(
  withAntiLateAlarm,
  'with-antilate-alarm',
  '1.0.0',
);
