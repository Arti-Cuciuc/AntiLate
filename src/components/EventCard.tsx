import { Text, View } from 'react-native';
import { useTheme } from './theme-provider';

import { MotionPressable as Pressable } from './motion/motion-pressable';
import { APP_TEXT, CARD_TIME_TEXT } from '../constants/typography';
import type { DisplayEvent } from '../types/display-event';
import type { Group } from '../types/group';
import { cn } from '../utils/cn';
import { formatEventDateLabel } from '../utils/date';
import { getGroupAppearance } from '../utils/groups';
import { getRecurringWeekdaysLabel } from '../utils/templates';

type EventCardProps = {
  event: DisplayEvent;
  group: Group;
  compact: boolean;
  currentDate: Date;
  onPress: () => void;
};

export function EventCard({
  event,
  group,
  compact,
  currentDate,
  onPress,
}: EventCardProps) {
  const { colors } = useTheme();
  const theme = getGroupAppearance(group, colors);
  const dateLabel = formatEventDateLabel(event.eventDate, currentDate);
  const recurrenceLabel = event.recurrenceWeekdays
    ? getRecurringWeekdaysLabel(event.recurrenceWeekdays)
    : null;

  return (
    <Pressable
      accessibilityLabel={`${event.place}, ${dateLabel}, прибыть к ${event.arrivalTime}, ${event.travelMinutes} минут в пути, ${event.preparationMinutes} минут на сборы${recurrenceLabel ? `, повторяется: ${recurrenceLabel}` : ''}`}
      accessibilityRole="button"
      className={cn(
        'h-[160px] overflow-hidden rounded-[24px] border-[2.5px] px-[18px] pb-[18px] pt-[14px]',
        compact && 'px-4',
      )}
      onPress={onPress}
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
      }}
    >
      <View className="flex-1 flex-row items-start justify-between">
        <View className="flex-1 pr-[10px]">
          <Text
            className={cn(APP_TEXT.large, 'text-ink')}
            numberOfLines={2}
            style={{ color: theme.textColor }}
          >
            {event.place}
          </Text>
          {event.detail ? (
            <Text
              className={cn(APP_TEXT.small, 'mt-1.5 text-muted')}
              ellipsizeMode="tail"
              numberOfLines={1}
              style={{ color: theme.mutedTextColor }}
            >
              {event.detail}
            </Text>
          ) : null}
        </View>

        <View
          className={cn('w-[96px] shrink-0 items-end', compact && 'w-[90px]')}
        >
          <Text
            className={cn(APP_TEXT.large, 'text-ink tabular-nums')}
            style={{ color: theme.textColor }}
          >
            {event.arrivalTime}
          </Text>
          <Text
            className={cn(APP_TEXT.small, 'mt-px text-right text-muted')}
            style={{ color: theme.mutedTextColor }}
          >
            {dateLabel}
          </Text>
          {recurrenceLabel ? (
            <Text
              className={cn(APP_TEXT.small, 'mt-px text-right')}
              numberOfLines={1}
              style={{ color: theme.mutedTextColor }}
            >
              ↻ {recurrenceLabel}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        className="h-px opacity-40"
        pointerEvents="none"
        style={{ backgroundColor: theme.borderColor }}
      />

      <View className="mt-[18px] flex-row items-center justify-between">
        <View className="flex-row items-baseline">
          <Text
            className={cn(APP_TEXT.medium, 'text-muted')}
            style={{ color: theme.mutedTextColor }}
          >
            Выход
          </Text>
          <Text
            className={cn(CARD_TIME_TEXT, 'ml-1.5 text-ink tabular-nums')}
            style={{ color: theme.textColor }}
          >
            {event.leaveTime}
          </Text>
        </View>

        <View className="ml-[18px] shrink-0 flex-row items-baseline justify-end">
          <Text
            className={cn(APP_TEXT.medium, 'text-muted')}
            numberOfLines={1}
            style={{ color: theme.mutedTextColor }}
          >
            В дороге
          </Text>
          <Text
            className={cn(CARD_TIME_TEXT, 'ml-1.5 text-ink tabular-nums')}
            style={{ color: theme.textColor }}
          >
            {event.travelMinutes} мин
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
