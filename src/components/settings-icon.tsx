import { useTheme } from './theme-provider';
import Svg, { Circle, Path } from 'react-native-svg';

type SettingsIconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export function SettingsIcon({
  color,
  size = 21,
  strokeWidth = 1.8,
}: SettingsIconProps) {
  const { colors } = useTheme();
  return (
    <Svg
      accessibilityElementsHidden
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <Path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.73v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.73l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"
        fill="none"
        stroke={color ?? colors.ink}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={12}
        cy={12}
        fill="none"
        r={3}
        stroke={color ?? colors.ink}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}
