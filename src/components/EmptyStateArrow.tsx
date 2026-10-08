import { useTheme } from './theme-provider';
import Svg, { Path } from 'react-native-svg';

import {
  APP_NAV_CONTENT_GAP,
  APP_NAV_HEIGHT,
  PAGE_GUTTER,
} from '../constants/layout';

type EmptyStateArrowProps = {
  width: number;
  height: number;
};

export function EmptyStateArrow({ width, height }: EmptyStateArrowProps) {
  const { colors } = useTheme();
  if (width === 0 || height === 0) {
    return null;
  }

  const navigationOffset = APP_NAV_HEIGHT + APP_NAV_CONTENT_GAP;
  const svgHeight = height + navigationOffset;
  const horizontalShift = 4;
  const buttonCenterX = width - PAGE_GUTTER - 8 - 20;
  const buttonCenterY = APP_NAV_HEIGHT / 2;
  const approachX = width * 0.8 + horizontalShift;
  const approachY = navigationOffset + height * 0.18;
  const aimX = buttonCenterX - approachX;
  const aimY = buttonCenterY - approachY;
  const aimLength = Math.hypot(aimX, aimY);
  const unitX = aimX / aimLength;
  const unitY = aimY / aimLength;
  // The endpoint stays on the exact ray toward the add button's centre.
  // Keeping a 22 px gap from its 20 px radius gives the arrow more air.
  const arrowGapFromCenter = 20 + 22;
  const endX = buttonCenterX - unitX * arrowGapFromCenter;
  const endY = buttonCenterY - unitY * arrowGapFromCenter;
  const lastControlX = endX - unitX * 46;
  const lastControlY = endY - unitY * 46;
  const path = [
    `M ${width * 0.54 + horizontalShift} ${navigationOffset + height * 0.46}`,
    `C ${width * 0.66 + horizontalShift} ${navigationOffset + height * 0.45}, ${width * 0.76 + horizontalShift} ${navigationOffset + height * 0.38}, ${width * 0.8 + horizontalShift} ${navigationOffset + height * 0.3}`,
    `C ${width * 0.83 + horizontalShift} ${navigationOffset + height * 0.23}, ${lastControlX} ${lastControlY}, ${endX} ${endY}`,
  ].join(' ');
  const baseX = endX - unitX * 15;
  const baseY = endY - unitY * 15;
  const perpendicularX = -unitY * 7;
  const perpendicularY = unitX * 7;
  const arrowHead = [
    `M ${baseX + perpendicularX} ${baseY + perpendicularY}`,
    `L ${endX} ${endY}`,
    `M ${baseX - perpendicularX} ${baseY - perpendicularY}`,
    `L ${endX} ${endY}`,
  ].join(' ');

  return (
    <Svg
      height={svgHeight}
      pointerEvents="none"
      style={{ left: 0, position: 'absolute', top: -navigationOffset }}
      width={width}
    >
      <Path
        d={path}
        fill="none"
        opacity={0.76}
        stroke={colors.placeholder}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
      />
      <Path
        d={arrowHead}
        fill="none"
        opacity={0.8}
        stroke={colors.placeholder}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.8}
      />
    </Svg>
  );
}
