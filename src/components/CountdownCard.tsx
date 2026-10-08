import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { APP_TEXT, CARD_TIME_TEXT } from '../constants/typography';
import type { PlannedEvent } from '../types/event';
import { cn } from '../utils/cn';
import { formatEventDateLabel } from '../utils/date';
import {
  getEventDepartureTimestamp,
  getEventPreparationTimestamp,
} from '../utils/events';

type CountdownCardProps = {
  event: PlannedEvent;
};

const PREPARATION_WARNING_MS = 5 * 60_000;

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(1, Math.ceil(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) {
    return `${days} д ${hours} ч ${String(minutes).padStart(2, '0')} мин`;
  }

  if (hours > 0) {
    return `${hours} ч ${String(minutes).padStart(2, '0')} мин`;
  }

  if (minutes > 0) {
    return `${minutes} мин`;
  }

  return `${totalSeconds} сек`;
}

function formatClock(timestamp: number) {
  const date = new Date(timestamp);

  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

export function CountdownCard({ event }: CountdownCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const departureTimestamp = getEventDepartureTimestamp(event);
  const preparationTimestamp = getEventPreparationTimestamp(event);
  const preparationWarningTimestamp =
    preparationTimestamp - PREPARATION_WARNING_MS;
  const dateLabel = formatEventDateLabel(event.eventDate, new Date(now));
  const eventSummary = `${event.place} · ${dateLabel} в ${event.arrivalTime}`;
  const isBeforePreparationWarning = now < preparationWarningTimestamp;
  const isBeforePreparation = now < preparationTimestamp;
  const isPreparing = now >= preparationTimestamp && now < departureTimestamp;
  const status = isBeforePreparationWarning
    ? {
        color: '#22C55E',
        heading: 'Можно не спешить',
        countdown: formatDuration(preparationTimestamp - now),
        countdownLabel: 'до сборов',
      }
    : isBeforePreparation
      ? {
          color: '#22C55E',
          heading: 'Можно начинать готовиться',
          countdown: formatDuration(preparationTimestamp - now),
          countdownLabel: 'до сборов',
        }
      : isPreparing
        ? {
            color: '#FACC15',
            heading: 'Пора собирать вещи',
            countdown: formatDuration(departureTimestamp - now),
            countdownLabel: 'до выхода',
          }
        : {
            color: '#EF4444',
            heading: 'Нужно выходить',
            countdown: formatDuration(now - departureTimestamp),
            countdownLabel: 'после времени выхода',
          };

  useEffect(() => {
    setNow(Date.now());

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [event.id, departureTimestamp, preparationTimestamp]);

  return (
    <View
      accessibilityLabel={`${status.heading}. ${eventSummary}. ${status.countdown} ${status.countdownLabel}. Сборы в ${formatClock(preparationTimestamp)}. Выход в ${event.leaveTime}`}
      className="mt-[26px] h-[160px] overflow-hidden rounded-[23px] bg-feature p-[18px]"
    >
      <View className="flex-row items-start justify-between">
        <View className="max-w-[48%] items-start pr-3">
          <Text
            adjustsFontSizeToFit
            className={cn(APP_TEXT.large, 'text-on-feature tabular-nums')}
            minimumFontScale={0.78}
            numberOfLines={1}
          >
            {status.countdown}
          </Text>
          <Text
            className={cn(APP_TEXT.small, 'mt-0.5 text-feature-muted')}
            numberOfLines={1}
          >
            {status.countdownLabel}
          </Text>
        </View>
        <View className="mt-1 max-w-[50%] flex-row items-center justify-end">
          <Text
            adjustsFontSizeToFit
            className={cn(
              APP_TEXT.medium,
              'shrink text-right text-feature-muted',
            )}
            minimumFontScale={0.82}
            numberOfLines={1}
          >
            {status.heading}
          </Text>
          <View
            className="ml-2 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: status.color }}
          />
        </View>
      </View>

      <View className="mt-auto h-px bg-feature-divider" />
      <View className="mt-[18px] flex-row items-center justify-between">
        <View className="flex-row items-baseline">
          <Text className={cn(APP_TEXT.medium, 'text-feature-muted')}>
            Сборы
          </Text>
          <Text
            className={cn(
              CARD_TIME_TEXT,
              'ml-1.5 text-on-feature tabular-nums',
            )}
          >
            {formatClock(preparationTimestamp)}
          </Text>
        </View>
        <View className="flex-row items-baseline">
          <Text className={cn(APP_TEXT.medium, 'text-feature-muted')}>
            Выход
          </Text>
          <Text
            className={cn(
              CARD_TIME_TEXT,
              'ml-1.5 text-on-feature tabular-nums',
            )}
          >
            {event.leaveTime}
          </Text>
        </View>
      </View>
    </View>
  );
}
