import type { CSSProperties } from 'react';
import { APP_TEXT } from '../../../src/constants/typography';
import { APP_NAV_HEIGHT, getAppContentTop, getAppNavigationTop, PAGE_GUTTER } from '../../../src/constants/layout';
import { DARK_COLORS, LIGHT_COLORS } from '../../../src/constants/theme';
import { getGroupAppearance } from '../../../src/utils/groups';

// Single source of truth: import the mobile app's pure design constants.
export const PREVIEW_SCREEN = { width: 390, height: 844, safeAreaTop: 36 };
export function nativeTextStyle(classes: string): CSSProperties {
  function value(pattern: RegExp) {
    const match = classes.match(pattern);
    if (!match) throw new Error(`Unsupported mobile typography: ${classes}`);
    return Number(match[1]);
  }
  return {
    fontFamily: 'Manrope, sans-serif',
    fontSize: value(/text-\[(-?[\d.]+)px\]/),
    lineHeight: `${value(/leading-\[(-?[\d.]+)px\]/)}px`,
    letterSpacing: value(/tracking-\[(-?[\d.]+)px\]/),
    fontWeight: classes.includes('extrabold') ? 800 : 400,
  };
}
export const PREVIEW_TEXT = Object.fromEntries(
  Object.entries(APP_TEXT).map(([name, classes]) => [name, nativeTextStyle(classes)]),
) as Record<keyof typeof APP_TEXT, CSSProperties>;
export function previewDesign(dark: boolean) {
  const colors = dark ? DARK_COLORS : LIGHT_COLORS;
  return {
    variables: {
      '--preview-paper': colors.paper, '--preview-ink': colors.ink,
      '--preview-muted': colors.muted, '--preview-nav': colors.nav,
      '--preview-nav-border': colors.navBorder, '--preview-divider': colors.divider,
      '--preview-canvas': colors.canvas, '--preview-action': colors.action,
      '--preview-outline': colors.outline, '--preview-placeholder': colors.placeholder,
      '--preview-wine': colors.wineDark,
      '--preview-on-action': colors.onAction, '--preview-action-muted': colors.onActionMuted,
      '--preview-feature': colors.feature, '--preview-on-feature': colors.onFeature,
      '--preview-feature-muted': colors.featureMuted, '--preview-feature-divider': colors.featureDivider,
      '--preview-gutter': `${PAGE_GUTTER}px`, '--preview-nav-height': `${APP_NAV_HEIGHT}px`,
      '--preview-nav-top': `${getAppNavigationTop(PREVIEW_SCREEN.safeAreaTop)}px`,
      '--preview-content-top': `${getAppContentTop(PREVIEW_SCREEN.safeAreaTop)}px`,
    } as CSSProperties,
    event: (color: string) => getGroupAppearance({ color }, colors),
  };
}
