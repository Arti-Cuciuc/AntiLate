import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_TEXT } from '../constants/typography';
import { cn } from '../utils/cn';
import { MotionModal } from './motion/motion-modal';
import { MotionPressable } from './motion/motion-pressable';

type StorageErrorModalProps = {
  loadError: boolean;
  saveError: boolean;
  onRetry: () => void;
  suspended?: boolean;
};

export function StorageErrorModal({
  loadError,
  saveError,
  onRetry,
  suspended = false,
}: StorageErrorModalProps) {
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!saveError) setDismissed(false);
  }, [saveError]);
  const dismiss = () => {
    if (!loadError) setDismissed(true);
  };

  return (
    <MotionModal
      visible={!suspended && (loadError || (saveError && !dismissed))}
      onRequestClose={dismiss}
      transparent
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-overlay px-[18px]">
        <View
          accessibilityViewIsModal
          className="w-full max-w-[560px] self-center rounded-[24px] bg-sheet p-[18px]"
          style={{ marginBottom: Math.max(insets.bottom + 18, 30) }}
        >
          <Text className={cn(APP_TEXT.large, 'text-ink')}>
            {loadError
              ? 'Не удалось загрузить данные'
              : 'Изменения не сохранены'}
          </Text>
          <Text className={cn(APP_TEXT.medium, 'mt-2 text-muted')}>
            {loadError
              ? 'Сохранённые данные не изменены. Попробуйте загрузить их ещё раз.'
              : 'Изменения пока доступны только в приложении и могут потеряться после его закрытия. Проверьте свободное место и повторите сохранение.'}
          </Text>
          <View className="mt-5 flex-row gap-2">
            {!loadError && (
              <MotionPressable
                accessibilityRole="button"
                onPress={dismiss}
                className="h-[52px] flex-1 items-center justify-center rounded-[18px] border border-outline"
              >
                <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                  Позже
                </Text>
              </MotionPressable>
            )}
            <MotionPressable
              accessibilityRole="button"
              onPress={onRetry}
              className="h-[52px] flex-1 items-center justify-center rounded-[18px] bg-action"
            >
              <Text className={cn(APP_TEXT.mediumStrong, 'text-on-action')}>
                {loadError ? 'Повторить загрузку' : 'Повторить сохранение'}
              </Text>
            </MotionPressable>
          </View>
        </View>
      </View>
    </MotionModal>
  );
}
