import { useTheme } from './theme-provider';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { MotionPressable as Pressable } from './motion/motion-pressable';
import {
  APP_NAV_HEIGHT,
  CONTENT_MAX_WIDTH,
  getAppNavigationTop,
  PAGE_GUTTER,
} from '../constants/layout';
import { HOME_BRAND_TEXT } from '../constants/typography';
import { cn } from '../utils/cn';
import { SettingsIcon } from './settings-icon';

type AppNavigationIslandProps = {
  collapseProgress: SharedValue<number>;
  onAddPress: () => void;
  onHomePress: () => void;
  onSettingsPress: () => void;
};

export function AppNavigationIsland({
  collapseProgress,
  onAddPress,
  onHomePress,
  onSettingsPress,
}: AppNavigationIslandProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const expandedWidth = Math.min(
    windowWidth - PAGE_GUTTER * 2,
    CONTENT_MAX_WIDTH,
  );
  const compactWidth = expandedWidth * 0.85;
  const animatedWidthStyle = useAnimatedStyle(() => ({
    width: interpolate(
      collapseProgress.value,
      [0, 1],
      [expandedWidth, compactWidth],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View
      className="absolute inset-x-0 z-50 items-center"
      pointerEvents="box-none"
      style={{ top: getAppNavigationTop(insets.top) }}
    >
      <Animated.View
        className="relative flex-row items-center justify-between rounded-[28px] border-[1.5px] border-nav-border bg-nav px-2"
        style={[{ height: APP_NAV_HEIGHT }, animatedWidthStyle]}
      >
        <Pressable
          accessibilityLabel="Открыть настройки"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-[20px] active:bg-[rgba(28,26,25,0.08)]"
          hitSlop={4}
          onPress={onSettingsPress}
        >
          <SettingsIcon color={colors.ink} size={25} strokeWidth={2.4} />
        </Pressable>

        <Pressable
          accessibilityLabel="На главный экран"
          accessibilityRole="button"
          className="absolute inset-y-0 left-12 right-12 items-center justify-center"
          onPress={onHomePress}
        >
          <Text
            className={cn(HOME_BRAND_TEXT, 'text-center text-ink')}
            numberOfLines={1}
          >
            AntiLate
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Добавить встречу"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-[20px] bg-action"
          hitSlop={4}
          onPress={onAddPress}
        >
          <Text
            className="-mt-0.5 text-center font-manrope-extrabold text-[26px] leading-[30px] text-on-action"
            style={{
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            +
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
