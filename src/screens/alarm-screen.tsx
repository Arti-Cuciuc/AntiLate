import { useTheme } from '../components/theme-provider';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionPressable as Pressable } from '../components/motion/motion-pressable';
import { APP_TEXT } from '../constants/typography';
import { canSnoozeAlarm } from '../notifications/notification-service';
import type { AlarmAction, AlarmPayload } from '../types/notification';
import { cn } from '../utils/cn';
import { formatEventDateLabel } from '../utils/date';

type AlarmScreenProps = {
  alarm: AlarmPayload;
  onAction: (alarm: AlarmPayload, action: AlarmAction) => Promise<void>;
};

function formatClock(timestamp: number) {
  const date = new Date(timestamp);

  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function formatCountdown(milliseconds: number) {
  if (milliseconds <= 0) {
    return 'уже сейчас';
  }

  const seconds = Math.ceil(milliseconds / 1_000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return minutes > 0
    ? `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
    : `${remainingSeconds} сек`;
}

export function AlarmScreen({ alarm, onAction }: AlarmScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCompactHeight = height < 720;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    const interval = setInterval(() => setNow(Date.now()), 1_000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const content = useMemo(() => {
    if (alarm.stage === 'departure') {
      return {
        heading: 'Пора выходить',
        counter: 'Сейчас',
        counterLabel: 'Статус',
        accentColor: '#EF4444',
        primaryAction: 'left' as const,
        primaryTitle: 'Я вышел',
      };
    }

    if (alarm.stage === 'midpoint') {
      return {
        heading: 'Сборы продолжаются',
        counter: formatCountdown(alarm.departureTimestamp - now),
        counterLabel: 'До выхода',
        accentColor: '#F59E0B',
        primaryAction: 'acknowledge' as const,
        primaryTitle: 'ОК',
      };
    }

    if (alarm.stage === 'test') {
      return {
        heading: 'Тест AntiLate',
        counter: 'Готово',
        counterLabel: 'Статус',
        accentColor: '#22C55E',
        primaryAction: 'acknowledge' as const,
        primaryTitle: 'ОК',
      };
    }

    return {
      heading: 'Пора собираться',
      counter: formatCountdown(alarm.departureTimestamp - now),
      counterLabel: 'До выхода',
      accentColor: colors.wine,
      primaryAction: 'acknowledge' as const,
      primaryTitle: 'ОК',
    };
  }, [alarm, now, colors.wine]);
  const showSnooze = canSnoozeAlarm(alarm, now);
  const dateLabel = formatEventDateLabel(alarm.eventDate, new Date(now));

  const handleAction = async (action: AlarmAction) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    await onAction(alarm, action);
  };

  return (
    <View
      className="flex-1 bg-paper px-[18px]"
      style={{
        paddingBottom: Math.max(insets.bottom + 18, 28),
        paddingTop: Math.max(insets.top + 18, 32),
      }}
    >
      <View className="w-full max-w-[560px] flex-1 self-center">
        <View className="flex-row items-center justify-between">
          <Text className={cn(APP_TEXT.large, 'text-ink')}>AntiLate</Text>
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: content.accentColor,
              transform: [{ translateY: -1 }],
            }}
          />
        </View>

        <View
          className={cn(
            'flex-1',
            isCompactHeight ? 'pb-3 pt-7' : 'pb-[18px] pt-9',
          )}
        >
          <Text
            className={cn(APP_TEXT.large, 'text-center text-ink')}
            style={{ includeFontPadding: false }}
          >
            {content.heading}
          </Text>

          <View
            className={cn(
              'mt-5 h-[160px] overflow-hidden rounded-[24px] bg-feature px-[18px] pb-[18px] pt-[14px]',
            )}
            style={{ borderCurve: 'continuous' }}
          >
            <View className="flex-1 flex-row items-start justify-between">
              <View className="flex-1 pr-[10px]">
                <Text
                  className={cn(APP_TEXT.large, 'text-on-feature')}
                  numberOfLines={2}
                >
                  {alarm.place}
                </Text>
                {alarm.detail ? (
                  <Text
                    className={cn(APP_TEXT.small, 'mt-1.5 text-feature-muted')}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {alarm.detail}
                  </Text>
                ) : null}
              </View>
              <View className="w-[96px] shrink-0 items-end">
                <Text
                  className={cn(APP_TEXT.large, 'text-on-feature tabular-nums')}
                >
                  {alarm.arrivalTime}
                </Text>
                <Text
                  className={cn(
                    APP_TEXT.small,
                    'mt-px text-right text-feature-muted',
                  )}
                >
                  {dateLabel}
                </Text>
              </View>
            </View>

            <View className="h-px bg-feature-divider" />

            <View className="mt-[18px] flex-row items-center justify-between">
              <View className="flex-row items-baseline">
                <Text className={cn(APP_TEXT.medium, 'text-feature-muted')}>
                  {content.counterLabel}
                </Text>
                <Text
                  className={cn(
                    APP_TEXT.mediumStrong,
                    'ml-1.5 text-on-feature tabular-nums',
                  )}
                >
                  {content.counter}
                </Text>
              </View>
              <View className="ml-[18px] shrink-0 flex-row items-baseline justify-end">
                <Text className={cn(APP_TEXT.medium, 'text-feature-muted')}>
                  {alarm.stage === 'test' ? 'Сигнал' : 'Выход'}
                </Text>
                <Text
                  className={cn(
                    APP_TEXT.mediumStrong,
                    'ml-1.5 text-on-feature tabular-nums',
                  )}
                >
                  {formatClock(
                    alarm.stage === 'test'
                      ? alarm.preparationTimestamp
                      : alarm.departureTimestamp,
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-3 pt-1">
          <Pressable
            accessibilityRole="button"
            className="h-[58px] items-center justify-center rounded-[24px] bg-action"
            disabled={isSubmitting}
            onPress={() => void handleAction(content.primaryAction)}
          >
            <Text className={cn(APP_TEXT.mediumStrong, 'text-on-action')}>
              {content.primaryTitle}
            </Text>
          </Pressable>

          {showSnooze ? (
            <Pressable
              accessibilityRole="button"
              className="h-[58px] items-center justify-center rounded-[24px] border-[2.5px] border-outline bg-canvas"
              disabled={isSubmitting}
              onPress={() => void handleAction('snooze')}
            >
              <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                Напомнить чуть позже
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
