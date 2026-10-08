import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionModal as Modal } from './motion/motion-modal';
import { MotionView } from './motion/motion-view';
import { MotionPressable as Pressable } from './motion/motion-pressable';
import { APP_TEXT } from '../constants/typography';
import type { MeetingTemplate } from '../types/template';
import { cn } from '../utils/cn';
import { getRecurringWeekdaysLabel } from '../utils/templates';

type TemplatePickerModalProps = {
  templates: MeetingTemplate[];
  visible: boolean;
  onClose: () => void;
  onSelect: (template: MeetingTemplate) => void;
};

export function TemplatePickerModal({
  templates,
  visible,
  onClose,
  onSelect,
}: TemplatePickerModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end bg-overlay">
        <Pressable
          accessibilityLabel="Закрыть выбор шаблона"
          className="absolute inset-0"
          onPress={onClose}
        />
        <MotionView
          className="max-h-[72%] w-full rounded-t-[28px] bg-paper px-[18px] pt-5"
          style={{ paddingBottom: Math.max(insets.bottom + 18, 30) }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className={cn(APP_TEXT.large, 'text-ink')}>
                Выберите шаблон
              </Text>
              <Text className={cn(APP_TEXT.small, 'mt-1 text-muted')}>
                Дата встречи останется без изменений
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Закрыть"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-[20px] border-2 border-outline"
              onPress={onClose}
            >
              <Text className="font-manrope text-[20px] leading-6 text-ink">
                ×
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {templates.map((template) => {
              const scheduleLabel = template.recurrence.isEnabled
                ? getRecurringWeekdaysLabel(template.recurrence.weekdays)
                : null;

              return (
                <Pressable
                  accessibilityLabel={`Применить шаблон ${template.name}`}
                  accessibilityRole="button"
                  className="min-h-[68px] flex-row items-center justify-between rounded-[20px] border-2 border-outline bg-canvas px-4 py-3"
                  key={template.id}
                  onPress={() => {
                    onClose();
                    setTimeout(() => onSelect(template), 120);
                  }}
                >
                  <View className="flex-1 pr-4">
                    <Text
                      className={cn(APP_TEXT.mediumStrong, 'text-ink')}
                      numberOfLines={1}
                    >
                      {template.name}
                    </Text>
                    <Text
                      className={cn(APP_TEXT.small, 'mt-1 text-muted')}
                      numberOfLines={1}
                    >
                      {template.place}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={cn(
                        APP_TEXT.mediumStrong,
                        'text-ink tabular-nums',
                      )}
                    >
                      {template.arrivalTime || '—'}
                    </Text>
                    <Text className={cn(APP_TEXT.small, 'mt-1 text-muted')}>
                      {scheduleLabel ? `↻ ${scheduleLabel}` : 'без повтора'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </MotionView>
      </View>
    </Modal>
  );
}
