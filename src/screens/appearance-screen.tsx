import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionPressable as Pressable } from '../components/motion/motion-pressable';
import { useTheme } from '../components/theme-provider';
import {
  DARK_COLORS,
  LIGHT_COLORS,
  THEME_LABELS,
  type ThemePreference,
} from '../constants/theme';
import { APP_TEXT } from '../constants/typography';
import { cn } from '../utils/cn';

const OPTIONS: ThemePreference[] = ['light', 'dark', 'system'];

function ThemePreview({ preference }: { preference: ThemePreference }) {
  const halves =
    preference === 'system'
      ? [LIGHT_COLORS, DARK_COLORS]
      : [preference === 'dark' ? DARK_COLORS : LIGHT_COLORS];
  return (
    <View
      className="h-[68px] w-[86px] flex-row overflow-hidden rounded-[14px] border border-divider"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {halves.map((palette, index) => (
        <View
          key={index}
          className="flex-1 gap-1.5 p-2"
          style={{ backgroundColor: palette.paper }}
        >
          <View
            className="h-1.5 w-3/4 rounded-full"
            style={{ backgroundColor: palette.ink }}
          />
          <View
            className="h-[18px] rounded-md"
            style={{ backgroundColor: palette.feature }}
          />
          <View
            className="h-[18px] rounded-md border"
            style={{
              backgroundColor: palette.canvas,
              borderColor: palette.outline,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export function AppearanceScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { preference, setPreference, storageError } = useTheme();
  return (
    <View className="flex-1 bg-paper">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top + 14, 30),
          paddingBottom: Math.max(insets.bottom + 30, 44),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[596px] self-center px-[18px]">
          <View className="h-[45px] flex-row items-center justify-between">
            <Text className={cn(APP_TEXT.large, 'text-ink')}>Тема</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Вернуться в настройки"
              className="h-[45px] w-[45px] items-center justify-center rounded-full border-[2.5px] border-outline"
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
          <View className="mt-7 gap-3" accessibilityRole="radiogroup">
            {OPTIONS.map((option) => {
              const selected = preference === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={THEME_LABELS[option]}
                  onPress={() => setPreference(option)}
                  className={cn(
                    'min-h-[106px] flex-row items-center gap-4 rounded-[24px] border-2 bg-canvas p-4',
                    selected ? 'border-ink' : 'border-divider',
                  )}
                >
                  <ThemePreview preference={option} />
                  <View className="flex-1">
                    <Text className={cn(APP_TEXT.mediumStrong, 'text-ink')}>
                      {THEME_LABELS[option]}
                    </Text>
                    <Text className={cn(APP_TEXT.small, 'mt-1 text-muted')}>
                      {option === 'system'
                        ? 'Меняется вместе с телефоном'
                        : option === 'dark'
                          ? 'Мягкий графит и тёплый свет'
                          : 'Светлые поверхности и чёткие линии'}
                    </Text>
                  </View>
                  <View
                    className={cn(
                      'h-5 w-5 items-center justify-center rounded-full border-2',
                      selected ? 'border-ink' : 'border-divider',
                    )}
                  >
                    {selected ? (
                      <View className="h-2.5 w-2.5 rounded-full bg-action" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text className={cn(APP_TEXT.small, 'mt-5 px-1 text-muted')}>
            Цвета ваших групп сохраняются в любой теме.
          </Text>
          {storageError ? (
            <Text
              accessibilityRole="alert"
              className={cn(APP_TEXT.small, 'mt-4 text-error')}
            >
              {storageError}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
