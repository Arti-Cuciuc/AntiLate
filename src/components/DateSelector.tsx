import { useTheme } from './theme-provider';
import type { RefObject } from 'react';
import { Text, TextInput, View } from 'react-native';

import { MotionView } from './motion/motion-view';
import { MotionPressable as Pressable } from './motion/motion-pressable';
import { APP_TEXT, FORM_LABEL_TEXT } from '../constants/typography';
import type { DateChoice } from '../types/event';
import { cn } from '../utils/cn';

type DateSelectorProps = {
  choice: DateChoice;
  customDay: string;
  dayInputRef: RefObject<TextInput | null>;
  isCompact: boolean;
  resolvedMonth: string | null;
  onChoiceChange: (choice: DateChoice) => void;
  onCustomDayChange: (value: string) => void;
  onCustomDayFocus: () => void;
};

const DATE_OPTIONS: Array<{ id: DateChoice; label: string }> = [
  { id: 'today', label: 'Сегодня' },
  { id: 'tomorrow', label: 'Завтра' },
  { id: 'custom', label: 'Другой день' },
];

export function DateSelector({
  choice,
  customDay,
  dayInputRef,
  isCompact,
  resolvedMonth,
  onChoiceChange,
  onCustomDayChange,
  onCustomDayFocus,
}: DateSelectorProps) {
  const { colors } = useTheme();
  return (
    <MotionView enter={false} className="gap-[7px]">
      <Text className={cn(FORM_LABEL_TEXT, 'ml-4 text-ink')}>ДАТА</Text>
      <View
        className={cn(
          'gap-[10px] rounded-[20px] border-[2.5px] border-outline bg-canvas p-3',
          isCompact && 'gap-[7px] p-[9px]',
        )}
      >
        <View className="flex-row gap-[7px]">
          {DATE_OPTIONS.map((option) => {
            const isSelected = choice === option.id;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className={cn(
                  'h-9 flex-1 items-center justify-center rounded-[13px] border-[1.5px] px-[5px]',
                  isSelected
                    ? 'border-action bg-action'
                    : 'border-divider bg-paper',
                )}
                key={option.id}
                onPress={() => onChoiceChange(option.id)}
              >
                <Text
                  className={cn(
                    isSelected ? APP_TEXT.mediumStrong : APP_TEXT.medium,
                    isSelected ? 'text-on-action' : 'text-ink',
                  )}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {choice === 'custom' ? (
          <MotionView className="mt-px">
            <View className="h-[54px] flex-row items-center rounded-2xl border-[2.5px] border-outline bg-paper px-[14px]">
              <TextInput
                ref={dayInputRef}
                accessibilityLabel="День встречи"
                className={cn(
                  APP_TEXT.large,
                  'h-full w-[58px] p-0 text-center text-ink tabular-nums',
                )}
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={onCustomDayChange}
                onFocus={onCustomDayFocus}
                placeholder="—"
                placeholderTextColor={colors.placeholder}
                selectionColor={colors.wine}
                value={customDay}
              />
              <View className="mx-[15px] h-[30px] w-[1.5px] bg-divider" />
              <Text
                className={cn(
                  APP_TEXT.medium,
                  resolvedMonth ? 'text-ink' : 'text-placeholder',
                )}
              >
                {resolvedMonth ?? 'укажите день'}
              </Text>
            </View>
          </MotionView>
        ) : null}
      </View>
    </MotionView>
  );
}
