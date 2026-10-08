import { useTheme } from '../components/theme-provider';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionView } from '../components/motion/motion-view';
import { MotionPressable as Pressable } from '../components/motion/motion-pressable';
import { MAX_TEMPLATES } from '../constants/templates';
import { APP_TEXT } from '../constants/typography';
import type { Group } from '../types/group';
import type { MeetingTemplate } from '../types/template';
import { cn } from '../utils/cn';
import { getGroupAppearance } from '../utils/groups';
import { getRecurringWeekdaysLabel } from '../utils/templates';

export type TemplatesScreenProps = {
  templates: MeetingTemplate[];
  groups: Group[];
  onBack: () => void;
  onCreate: () => void;
  onEdit: (templateId: string) => void;
};

function getScheduleLabel(template: MeetingTemplate) {
  if (!template.recurrence.isEnabled) {
    if (template.recurrence.weekdays.length > 0) {
      const pausedWeekdays =
        template.recurrence.weekdays.length === 7
          ? 'Каждый день'
          : getRecurringWeekdaysLabel(template.recurrence.weekdays);

      return `Пауза · ${pausedWeekdays} · ${template.arrivalTime ?? 'время не указано'}`;
    }

    return template.arrivalTime
      ? `При создании · ${template.arrivalTime}`
      : 'Время при создании';
  }

  const weekdays =
    template.recurrence.weekdays.length === 7
      ? 'Каждый день'
      : getRecurringWeekdaysLabel(template.recurrence.weekdays);

  return `↻ ${weekdays} · ${template.arrivalTime ?? 'время не указано'}`;
}

export function TemplatesScreen({
  templates,
  groups,
  onBack,
  onCreate,
  onEdit,
}: TemplatesScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const hasReachedLimit = templates.length >= MAX_TEMPLATES;

  return (
    <View className="flex-1 bg-paper">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom + 30, 44),
          paddingTop: Math.max(insets.top + 14, 30),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[596px] flex-1 self-center px-[18px]">
          <View className="h-[45px] flex-row items-center justify-between">
            <Text
              className={cn(APP_TEXT.large, 'flex-1 pr-3 text-ink')}
              style={{ includeFontPadding: false }}
            >
              Шаблоны встреч
            </Text>
            <Pressable
              accessibilityLabel="Вернуться к настройкам"
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

          {templates.length === 0 ? (
            <View className="mt-6 min-h-[160px] items-center justify-center rounded-[22px] border-[2.5px] border-outline bg-canvas px-8">
              <Text
                className={cn(APP_TEXT.mediumStrong, 'text-center text-ink')}
              >
                Шаблонов пока нет
              </Text>
              <Text
                className={cn(APP_TEXT.small, 'mt-2 text-center text-muted')}
              >
                Сохраните частую встречу или настройте постоянное расписание
              </Text>
            </View>
          ) : (
            <View className="mt-6 gap-4">
              {templates.map((template) => {
                const group = groups.find(
                  (option) => option.id === template.groupId,
                );
                const groupAppearance = group
                  ? getGroupAppearance(group)
                  : null;

                return (
                  <MotionView key={template.id}>
                    <Pressable
                      accessibilityHint="Открывает редактирование шаблона"
                      accessibilityLabel={`Шаблон ${template.name}`}
                      accessibilityRole="button"
                      className="min-h-[142px] rounded-[22px] border-[2.5px] border-outline bg-canvas p-[18px]"
                      onPress={() => onEdit(template.id)}
                    >
                      <View className="flex-row items-start justify-between gap-4">
                        <View className="min-w-0 flex-1">
                          <Text
                            className={cn(APP_TEXT.large, 'text-ink')}
                            numberOfLines={1}
                          >
                            {template.name}
                          </Text>
                          <Text
                            className={cn(APP_TEXT.medium, 'mt-1 text-muted')}
                            numberOfLines={1}
                          >
                            {template.place}
                          </Text>
                        </View>
                        <Text className="-mt-1 font-manrope text-[22px] text-placeholder">
                          ›
                        </Text>
                      </View>

                      <Text
                        className={cn(
                          template.recurrence.isEnabled
                            ? APP_TEXT.mediumStrong
                            : APP_TEXT.medium,
                          'mt-4 text-ink',
                        )}
                        numberOfLines={1}
                      >
                        {getScheduleLabel(template)}
                      </Text>

                      <View className="mt-auto flex-row items-end justify-between gap-4 pt-4">
                        <Text
                          className={cn(APP_TEXT.small, 'flex-1 text-muted')}
                          numberOfLines={1}
                        >
                          В дороге {template.travelMinutes} мин · На сборы{' '}
                          {template.preparationMinutes} мин
                        </Text>
                        <View className="max-w-[42%] flex-row items-center gap-[6px]">
                          <View
                            className="h-[10px] w-[10px] rounded-[5px] border"
                            style={{
                              backgroundColor: group?.color ?? colors.canvas,
                              borderColor:
                                groupAppearance?.borderColor ??
                                colors.placeholder,
                            }}
                          />
                          <Text
                            className={cn(APP_TEXT.small, 'text-muted')}
                            numberOfLines={1}
                          >
                            {group?.name ?? 'Без группы'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </MotionView>
                );
              })}
            </View>
          )}

          <View className="mt-auto flex-row items-center justify-between gap-4 pt-5">
            <Text className={cn(APP_TEXT.small, 'text-muted')}>
              {templates.length} из {MAX_TEMPLATES}
            </Text>
            <Pressable
              accessibilityLabel="Создать шаблон встречи"
              accessibilityRole="button"
              accessibilityState={{ disabled: hasReachedLimit }}
              className="h-11 items-center justify-center rounded-[16px] border-2 border-outline px-4 disabled:opacity-30"
              disabled={hasReachedLimit}
              onPress={onCreate}
            >
              <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                + Новый шаблон
              </Text>
            </Pressable>
          </View>

          {hasReachedLimit ? (
            <Text className={cn(APP_TEXT.small, 'mt-3 text-muted')}>
              Достигнут максимум шаблонов
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
