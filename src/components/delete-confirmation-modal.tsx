import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionModal as Modal } from './motion/motion-modal';
import { MotionView } from './motion/motion-view';
import { MotionPressable as Pressable } from './motion/motion-pressable';
import { APP_TEXT } from '../constants/typography';
import { cn } from '../utils/cn';

type DeleteConfirmationModalProps = {
  description: string;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmationModal({
  description,
  visible,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end bg-overlay px-[18px]">
        <Pressable
          accessibilityLabel="Закрыть подтверждение удаления"
          className="absolute inset-0"
          onPress={onCancel}
        />
        <MotionView
          accessibilityViewIsModal
          className="w-full max-w-[560px] self-center rounded-[24px] bg-sheet p-[18px]"
          style={{ marginBottom: Math.max(insets.bottom + 18, 30) }}
        >
          <Text className={cn(APP_TEXT.large, 'text-ink')}>
            Точно хотите удалить?
          </Text>
          <Text className={cn(APP_TEXT.medium, 'mt-2 text-muted')}>
            {description}
          </Text>

          <View className="mt-5 flex-row gap-2">
            <Pressable
              accessibilityLabel="Отменить удаление"
              accessibilityRole="button"
              className="h-[52px] flex-1 items-center justify-center rounded-[18px] bg-action"
              onPress={onCancel}
            >
              <Text className={cn(APP_TEXT.mediumStrong, 'text-on-action')}>
                Отмена
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Подтвердить удаление"
              accessibilityRole="button"
              className="h-[52px] flex-1 items-center justify-center rounded-[18px] bg-danger"
              onPress={onConfirm}
            >
              <Text className={cn(APP_TEXT.mediumStrong, 'text-on-danger')}>
                Удалить
              </Text>
            </Pressable>
          </View>
        </MotionView>
      </View>
    </Modal>
  );
}
