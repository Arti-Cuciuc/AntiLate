import { useEffect, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionPressable as Pressable } from '../components/motion/motion-pressable';
import { MotionToggle } from '../components/motion/motion-toggle';
import { APP_TEXT } from '../constants/typography';
import type { NotificationCapabilities } from '../types/notification';
import { cn } from '../utils/cn';

type NotificationsScreenProps = {
  capabilities: NotificationCapabilities;
  isRefreshing: boolean;
  onBack: () => void;
  onOpenBackgroundSettings: () => Promise<void>;
  onOpenChannelSettings: () => Promise<void>;
  onOpenExactAlarmSettings: () => Promise<void>;
  onOpenFullScreenSettings: () => Promise<void>;
  onRefresh: () => Promise<NotificationCapabilities>;
  onRequestPermission: () => Promise<void>;
  onSoundEnabledChange: (enabled: boolean) => Promise<void>;
  onTest: () => Promise<boolean>;
  soundEnabled: boolean;
};

type PermissionRowProps = {
  title: string;
  description: string;
  enabled: boolean;
  optional?: boolean;
  onPress: () => Promise<void>;
};

function PermissionRow({
  title,
  description,
  enabled,
  optional,
  onPress,
}: PermissionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-[78px] flex-row items-center px-[18px] py-4"
      onPress={() => void onPress()}
    >
      <View
        className={cn(
          'mr-3 h-3 w-3 rounded-full',
          enabled ? 'bg-[#22C55E]' : optional ? 'bg-[#FACC15]' : 'bg-[#EF4444]',
        )}
      />
      <View className="flex-1 pr-4">
        <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>{title}</Text>
        <Text className={cn(APP_TEXT.small, 'mt-1 text-muted')}>
          {description}
        </Text>
      </View>
      <Text className="font-manrope text-[22px] text-placeholder">›</Text>
    </Pressable>
  );
}

export function NotificationsScreen({
  capabilities,
  isRefreshing,
  onBack,
  onOpenBackgroundSettings,
  onOpenChannelSettings,
  onOpenExactAlarmSettings,
  onOpenFullScreenSettings,
  onRefresh,
  onRequestPermission,
  onSoundEnabledChange,
  onTest,
  soundEnabled,
}: NotificationsScreenProps) {
  const insets = useSafeAreaInsets();
  const [testMessage, setTestMessage] = useState('');
  const isReady =
    capabilities.supported &&
    capabilities.notificationsEnabled &&
    capabilities.exactAlarmsEnabled &&
    capabilities.fullScreenEnabled &&
    capabilities.channelEnabled;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void onRefresh();
      }
    });

    return () => subscription.remove();
  }, [onRefresh]);

  const handleTest = async () => {
    setTestMessage('');
    const didSchedule = await onTest();
    setTestMessage(
      didSchedule
        ? 'Тест сработает через 3 секунды'
        : 'Сначала включите обязательные разрешения',
    );
  };

  return (
    <View className="flex-1 bg-paper">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 30, 44),
          paddingTop: Math.max(insets.top + 14, 30),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[596px] self-center px-[18px]">
          <View className="h-[45px] flex-row items-center justify-between">
            <Text className={cn(APP_TEXT.large, 'flex-1 pr-3 text-ink')}>
              Уведомления
            </Text>
            <Pressable
              accessibilityLabel="Вернуться в настройки"
              accessibilityRole="button"
              className="h-[45px] w-[45px] items-center justify-center rounded-[22.5px] border-[2.5px] border-outline"
              onPress={onBack}
            >
              <Text
                className="-mt-0.5 font-manrope text-[24px] leading-7 text-ink"
                style={{ includeFontPadding: false }}
              >
                ←
              </Text>
            </Pressable>
          </View>

          {!capabilities.supported ? (
            <View className="mt-7 rounded-[24px] border-[2.5px] border-outline bg-canvas p-[18px]">
              <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                Нужна development-сборка
              </Text>
              <Text className={cn(APP_TEXT.small, 'mt-2 text-muted')}>
                Полноэкранные alarm-уведомления недоступны в Expo Go. Они
                заработают в специальном APK AntiLate.
              </Text>
            </View>
          ) : (
            <>
              <View className="mt-7 overflow-hidden rounded-[24px] border-[2.5px] border-outline bg-canvas">
                <PermissionRow
                  description="Разрешает AntiLate показывать напоминания"
                  enabled={capabilities.notificationsEnabled}
                  onPress={onRequestPermission}
                  title="Уведомления"
                />
                <View className="h-px bg-divider" />
                <PermissionRow
                  description="Чтобы сборы начинались точно в рассчитанную минуту"
                  enabled={capabilities.exactAlarmsEnabled}
                  onPress={onOpenExactAlarmSettings}
                  title="Точные будильники"
                />
                <View className="h-px bg-divider" />
                <PermissionRow
                  description="Показывает экран AntiLate поверх блокировки"
                  enabled={capabilities.fullScreenEnabled}
                  onPress={onOpenFullScreenSettings}
                  title="Полный экран"
                />
                <View className="h-px bg-divider" />
                <PermissionRow
                  description="Проверьте вибрацию и способ показа сигнала"
                  enabled={capabilities.channelEnabled}
                  onPress={onOpenChannelSettings}
                  title="Важные напоминания"
                />
                <View className="h-px bg-divider" />
                <Pressable
                  accessibilityLabel="Короткий звук сигнала"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: soundEnabled }}
                  className="min-h-[78px] flex-row items-center px-[18px] py-4"
                  disabled={isRefreshing}
                  onPress={() => void onSoundEnabledChange(!soundEnabled)}
                >
                  <View className="flex-1 pr-4">
                    <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                      Короткий звук
                    </Text>
                    <Text className={cn(APP_TEXT.small, 'mt-1 text-muted')}>
                      Один системный звук. «Не беспокоить» и громкость телефона
                      важнее.
                    </Text>
                  </View>
                  <MotionToggle checked={soundEnabled} />
                </Pressable>
                <View className="h-px bg-divider" />
                <PermissionRow
                  description="Рекомендуется на телефонах с агрессивной экономией батареи"
                  enabled={!capabilities.batteryOptimizationEnabled}
                  onPress={onOpenBackgroundSettings}
                  optional
                  title="Фоновая работа"
                />
              </View>

              <View className="mt-[18px] rounded-[24px] border-[2.5px] border-outline bg-canvas p-[18px]">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                      {isReady ? 'Всё готово' : 'Требуется настройка'}
                    </Text>
                    <Text className={cn(APP_TEXT.small, 'mt-1 text-muted')}>
                      {isReady
                        ? 'Проверьте сигнал перед первой важной встречей'
                        : 'Включите пункты, отмеченные красным'}
                    </Text>
                  </View>
                  <View
                    className={cn(
                      'h-3 w-3 rounded-full',
                      isReady ? 'bg-[#22C55E]' : 'bg-[#EF4444]',
                    )}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  className={cn(
                    'mt-[18px] h-[52px] items-center justify-center rounded-[20px] bg-action',
                    (isRefreshing || !isReady) && 'opacity-40',
                  )}
                  disabled={isRefreshing || !isReady}
                  onPress={() => void handleTest()}
                >
                  <Text className={cn(APP_TEXT.mediumStrong, 'text-on-action')}>
                    Проверить через 3 секунды
                  </Text>
                </Pressable>

                {testMessage ? (
                  <Text
                    className={cn(
                      APP_TEXT.small,
                      'mt-3 text-center text-muted',
                    )}
                  >
                    {testMessage}
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
