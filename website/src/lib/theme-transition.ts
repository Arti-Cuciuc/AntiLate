export type ThemeOrigin = { x: number; y: number };

export function themeWaveRadius(origin: ThemeOrigin, width: number, height: number) {
  return Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y));
}

let activeTransition: ViewTransition | undefined;

/** A real reveal of the new page, not a coloured overlay hiding its content. */
export function transitionTheme(update: () => void, origin?: ThemeOrigin) {
  activeTransition?.skipTransition();
  if (!origin || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }

  const root = document.documentElement;
  root.classList.add('theme-wave-active');
  const transition = document.startViewTransition(update);
  activeTransition = transition;
  transition.ready.then(() => {
    const radius = themeWaveRadius(origin, innerWidth, innerHeight);
    root.animate({ clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] }, {
      duration: 560,
      easing: 'cubic-bezier(.22,.65,.25,1)',
      fill: 'both',
      pseudoElement: '::view-transition-new(root)',
    });
  }).catch(() => { /* Skipped transitions still apply the selected theme. */ });
  transition.finished.finally(() => {
    if (activeTransition !== transition) return;
    root.classList.remove('theme-wave-active');
    activeTransition = undefined;
  }).catch(() => {});
}
