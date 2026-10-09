import { useEffect } from 'react';

// Animate once on arrival. Content stays visible without JS or with reduced motion.
export function useSectionMotion() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    const elements = document.querySelectorAll<HTMLElement>('main > section');
    const configure = () => {
      observer?.disconnect();
      elements.forEach(element => element.classList.remove('reveal-pending'));
      if (query.matches) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('reveal-pending');
          entry.target.classList.add('reveal-enter');
          observer?.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
      elements.forEach(element => {
        if (element.classList.contains('reveal-enter')) return;
        if (element.getBoundingClientRect().top >= window.innerHeight) element.classList.add('reveal-pending');
        observer?.observe(element);
      });
    };
    configure();
    query.addEventListener('change', configure);
    return () => { observer?.disconnect(); query.removeEventListener('change', configure); elements.forEach(element => element.classList.remove('reveal-pending')); };
  }, []);
}
