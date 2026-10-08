import { useTheme } from './theme-provider';
import { ScrollView, Text, View } from 'react-native';

import { MotionPressable as Pressable } from './motion/motion-pressable';
import {
  ALL_GROUPS_FILTER_ID,
  UNGROUPED_FILTER_ID,
  UNGROUPED_GROUP,
} from '../constants/groups';
import { APP_TEXT } from '../constants/typography';
import { SCHEDULE_FILTER_ID } from '../constants/templates';
import type { Group } from '../types/group';
import { cn } from '../utils/cn';

export type GroupFilterValue = string;

type GroupFilterProps = {
  counts: Record<string, number>;
  groups: Group[];
  showSchedule: boolean;
  showUngrouped: boolean;
  value: GroupFilterValue;
  onChange: (value: GroupFilterValue) => void;
};

type FilterOption = Pick<Group, 'id' | 'name' | 'color'>;

const ALL_FILTER: FilterOption = {
  id: ALL_GROUPS_FILTER_ID,
  name: 'Все',
  color: '#1C1A19',
};

const SCHEDULE_FILTER: FilterOption = {
  id: SCHEDULE_FILTER_ID,
  name: 'Расписание',
  color: '#1C1A19',
};

export function GroupFilter({
  counts,
  groups,
  showSchedule,
  showUngrouped,
  value,
  onChange,
}: GroupFilterProps) {
  const { colors } = useTheme();
  const options = [
    ALL_FILTER,
    ...(showSchedule ? [SCHEDULE_FILTER] : []),
    ...groups,
    ...(showUngrouped ? [UNGROUPED_GROUP] : []),
  ];

  return (
    <View accessibilityRole="tablist">
      <ScrollView
        contentContainerStyle={{ gap: 6, paddingRight: 2 }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {options.map((option) => {
          const isSelected = value === option.id;
          const isUngrouped = option.id === UNGROUPED_FILTER_ID;
          const isSchedule = option.id === SCHEDULE_FILTER_ID;

          return (
            <Pressable
              accessibilityLabel={
                option.id === ALL_GROUPS_FILTER_ID
                  ? 'Показать все встречи'
                  : isSchedule
                    ? 'Показать встречи из расписания'
                    : `Показать встречи группы ${option.name}`
              }
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              className="h-10 flex-row items-center gap-2 rounded-[20px] border-2 px-3"
              key={option.id}
              onPress={() => onChange(option.id)}
              style={{
                backgroundColor: isSelected ? colors.action : colors.canvas,
                borderColor: isSelected ? colors.action : colors.divider,
              }}
            >
              {isSchedule ? (
                <Text
                  className={
                    isSelected ? APP_TEXT.mediumStrong : APP_TEXT.medium
                  }
                  style={{ color: isSelected ? colors.onAction : colors.ink }}
                >
                  ↻
                </Text>
              ) : option.id !== ALL_GROUPS_FILTER_ID ? (
                <View
                  className="h-3 w-3 rounded-md border"
                  style={{
                    backgroundColor: isUngrouped ? colors.canvas : option.color,
                    borderColor: isUngrouped
                      ? colors.placeholder
                      : option.color,
                  }}
                />
              ) : null}
              <Text
                className={isSelected ? APP_TEXT.mediumStrong : APP_TEXT.medium}
                style={{ color: isSelected ? colors.onAction : colors.ink }}
              >
                {option.name}
              </Text>
              <Text
                className={cn(APP_TEXT.small, 'tabular-nums')}
                style={{
                  color: isSelected ? colors.onActionMuted : colors.muted,
                }}
              >
                {counts[option.id] ?? 0}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
