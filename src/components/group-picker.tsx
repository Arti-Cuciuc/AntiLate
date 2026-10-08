import { useTheme } from './theme-provider';
import { ScrollView, Text, View } from 'react-native';

import { MotionPressable as Pressable } from './motion/motion-pressable';
import { UNGROUPED_GROUP } from '../constants/groups';
import { APP_TEXT, FORM_LABEL_TEXT } from '../constants/typography';
import type { Group } from '../types/group';
import { cn } from '../utils/cn';

type GroupPickerProps = {
  groups: Group[];
  isCompact: boolean;
  value: string | null;
  onChange: (groupId: string | null) => void;
};

export function GroupPicker({
  groups,
  isCompact,
  value,
  onChange,
}: GroupPickerProps) {
  const { colors } = useTheme();
  const options: Array<Group & { value: string | null }> = [
    { ...UNGROUPED_GROUP, value: null },
    ...groups.map((group) => ({ ...group, value: group.id })),
  ];

  return (
    <View className="gap-[7px]">
      <Text className={cn(FORM_LABEL_TEXT, 'ml-4 text-ink')}>ГРУППА</Text>
      <View
        className={cn(
          'gap-[9px] rounded-[20px] border-[2.5px] border-outline bg-canvas p-3',
          isCompact && 'gap-[7px] p-[9px]',
        )}
      >
        <ScrollView
          contentContainerStyle={{ gap: 6, paddingRight: 2 }}
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
        >
          {options.map((option) => {
            const isSelected = value === option.value;

            return (
              <Pressable
                accessibilityLabel={`Выбрать: ${option.name}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className={cn(
                  'h-9 flex-row items-center gap-[7px] rounded-[18px] border-2 px-[10px]',
                  isCompact && 'h-8',
                )}
                key={option.id}
                onPress={() => onChange(option.value)}
                style={{
                  backgroundColor: isSelected ? colors.action : colors.tint,
                  borderColor: isSelected ? colors.action : colors.divider,
                }}
              >
                <View
                  className="h-3 w-3 rounded-md border"
                  style={{
                    backgroundColor:
                      option.value === null ? colors.canvas : option.color,
                    borderColor:
                      option.value === null ? colors.placeholder : option.color,
                  }}
                />
                <Text
                  className={
                    isSelected ? APP_TEXT.mediumStrong : APP_TEXT.medium
                  }
                  style={{ color: isSelected ? colors.onAction : colors.ink }}
                >
                  {option.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {groups.length === 0 ? (
          <Text className={cn(APP_TEXT.small, 'text-muted')}>
            Создать свои группы можно в настройках
          </Text>
        ) : null}
      </View>
    </View>
  );
}
