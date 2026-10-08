import { useTheme } from '../components/theme-provider';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionPressable as Pressable } from '../components/motion/motion-pressable';
import { APP_TEXT } from '../constants/typography';
import { cn } from '../utils/cn';

type AboutScreenProps = {
  onBack: () => void;
};

const ABOUT_SECTIONS = [
  {
    id: 'purpose',
    title: 'О проекте',
    description:
      'AntiLate помогает заранее понять, когда начать собираться и во сколько выйти, чтобы прийти на встречу вовремя.',
  },
  {
    id: 'features',
    title: 'Возможности',
    description:
      'Встречи, время на сборы и дорогу, автоматический расчёт времени выхода и удобная сортировка по группам.',
  },
  {
    id: 'privacy',
    title: 'Ваши данные',
    description:
      'Встречи и группы сохраняются локально на этом устройстве. Для работы приложения не требуется аккаунт.',
  },
] as const;

export function AboutScreen({ onBack }: AboutScreenProps) {
  const { colors } = useTheme();
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
        <View className="w-full max-w-[596px] flex-1 self-center px-[18px]">
          <View className="h-[45px] flex-row items-center justify-between">
            <Text
              className={cn(APP_TEXT.large, 'flex-1 pr-3 text-ink')}
              style={{ includeFontPadding: false }}
            >
              О приложении
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

          <View className="mt-6 rounded-[24px] bg-feature p-[18px]">
            <Text selectable className={cn(APP_TEXT.large, 'text-on-feature')}>
              AntiLate
            </Text>
            <Text
              selectable
              className={cn(APP_TEXT.medium, 'mt-3 text-on-feature')}
            >
              Спокойно собраться. Вовремя выйти.
            </Text>
          </View>

          <View className="mt-[18px] overflow-hidden rounded-[24px] border-[2.5px] border-outline bg-canvas">
            {ABOUT_SECTIONS.map((section, index) => (
              <View
                className="px-[18px] py-[16px]"
                key={section.id}
                style={
                  index < ABOUT_SECTIONS.length - 1
                    ? {
                        borderBottomColor: colors.divider,
                        borderBottomWidth: 1.5,
                      }
                    : undefined
                }
              >
                <Text
                  selectable
                  className={cn(APP_TEXT.mediumStrong, 'text-ink')}
                >
                  {section.title}
                </Text>
                <Text
                  selectable
                  className={cn(APP_TEXT.small, 'mt-2 text-muted')}
                >
                  {section.description}
                </Text>
              </View>
            ))}
          </View>

          <View className="mt-[18px] flex-row items-center justify-between rounded-[20px] border-[2.5px] border-outline bg-canvas px-[18px] py-[16px]">
            <Text selectable className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
              Версия
            </Text>
            <Text
              selectable
              className={cn(APP_TEXT.medium, 'text-muted')}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
