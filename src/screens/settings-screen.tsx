import { useTheme } from '../components/theme-provider';
import { THEME_LABELS } from '../constants/theme';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionPressable as Pressable } from '../components/motion/motion-pressable';
import { APP_TEXT } from '../constants/typography';
import { cn } from '../utils/cn';

type SettingsScreenProps = {
  onBack: () => void;
  onAboutPress: () => void;
  onAppearancePress: () => void;
  onGroupsPress: () => void;
  onNotificationsPress: () => void;
  onTemplatesPress: () => void;
  notificationsReady: boolean;
};

const SETTINGS_ITEMS = [
  {
    id: 'groups',
    title: 'Группы',
    description: 'Названия и цвета для сортировки',
  },
  {
    id: 'templates',
    title: 'Шаблоны встреч',
    description: 'Быстрое создание планов',
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    description: 'Полный экран, вибрация и точное время',
  },
  {
    id: 'theme',
    title: 'Тема',
    description: 'Оформление приложения',
  },
  {
    id: 'about',
    title: 'О приложении',
    description: 'Версия и информация',
  },
] as const;

export function SettingsScreen({
  onBack,
  onAboutPress,
  onAppearancePress,
  onGroupsPress,
  onNotificationsPress,
  onTemplatesPress,
  notificationsReady,
}: SettingsScreenProps) {
  const { colors, preference } = useTheme();
  const insets = useSafeAreaInsets();

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
        <View className="w-full max-w-[596px] self-center px-[18px]">
          <View className="h-[45px] flex-row items-center justify-between">
            <Text className={cn(APP_TEXT.large, 'flex-1 pr-3 text-ink')}>
              Настройки
            </Text>
            <Pressable
              accessibilityLabel="Вернуться на главный экран"
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

          <View className="mt-7 overflow-hidden rounded-[24px] border-[2.5px] border-outline bg-canvas">
            {SETTINGS_ITEMS.map((item, index) => {
              const isEnabled =
                item.id === 'groups' ||
                item.id === 'templates' ||
                item.id === 'notifications' ||
                item.id === 'about' ||
                item.id === 'theme';

              return (
                <Pressable
                  accessibilityLabel={item.title}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !isEnabled }}
                  className="h-[76px] flex-row items-center justify-between px-[18px]"
                  disabled={!isEnabled}
                  key={item.title}
                  onPress={
                    item.id === 'groups'
                      ? onGroupsPress
                      : item.id === 'templates'
                        ? onTemplatesPress
                        : item.id === 'notifications'
                          ? onNotificationsPress
                          : item.id === 'about'
                            ? onAboutPress
                            : onAppearancePress
                  }
                  style={
                    index < SETTINGS_ITEMS.length - 1
                      ? {
                          borderBottomColor: colors.divider,
                          borderBottomWidth: 1.5,
                        }
                      : undefined
                  }
                >
                  <View className="flex-1 pr-4">
                    <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                      {item.title}
                    </Text>
                    <Text className={cn(APP_TEXT.small, 'mt-1 text-muted')}>
                      {item.id === 'notifications' && !notificationsReady
                        ? 'Требуется настройка разрешений'
                        : item.id === 'theme'
                          ? THEME_LABELS[preference]
                          : item.description}
                    </Text>
                  </View>
                  <Text className="font-manrope text-[22px] text-placeholder">
                    ›
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
