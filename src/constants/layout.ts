export const PAGE_GUTTER = 18;
export const CONTENT_MAX_WIDTH = 560;
export const HEADER_BUTTON_SIZE = 45;

export const APP_NAV_HEIGHT = 56;
export const APP_NAV_MIN_TOP = 18;
export const APP_NAV_SAFE_GAP = 10;
export const APP_NAV_CONTENT_GAP = 18;

export function getAppNavigationTop(safeAreaTop: number) {
  return Math.max(safeAreaTop + APP_NAV_SAFE_GAP, APP_NAV_MIN_TOP);
}

export function getAppContentTop(safeAreaTop: number) {
  return (
    getAppNavigationTop(safeAreaTop) +
    APP_NAV_HEIGHT +
    APP_NAV_CONTENT_GAP
  );
}
