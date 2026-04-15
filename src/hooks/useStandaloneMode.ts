import { useEffect, useState } from 'react';

function readNavigatorStandalone() {
  return typeof navigator !== 'undefined' && 'standalone' in navigator
    ? Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    : false;
}

function detectStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    readNavigatorStandalone()
  );
}

export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(() => detectStandaloneMode());

  useEffect(() => {
    const mediaQueries = [
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: fullscreen)'),
    ];

    const updateStandaloneState = () => {
      setIsStandalone(mediaQueries.some((query) => query.matches) || readNavigatorStandalone());
    };

    updateStandaloneState();

    mediaQueries.forEach((query) => {
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', updateStandaloneState);
        return;
      }

      query.addListener(updateStandaloneState);
    });

    window.addEventListener('pageshow', updateStandaloneState);

    return () => {
      mediaQueries.forEach((query) => {
        if (typeof query.removeEventListener === 'function') {
          query.removeEventListener('change', updateStandaloneState);
          return;
        }

        query.removeListener(updateStandaloneState);
      });

      window.removeEventListener('pageshow', updateStandaloneState);
    };
  }, []);

  return isStandalone;
}
