import { useEffect, useState } from 'react';
import type { TimelineDateItem } from './timelineItems';

export function useActiveTimelineDateAnchor(dateItems: TimelineDateItem[], enabled = true) {
  const [activeDateAnchor, setActiveDateAnchor] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || dateItems.length === 0) {
      setActiveDateAnchor(null);
      return;
    }

    let frameId: number | null = null;

    const handleScroll = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        let currentAnchor = dateItems[0].data.anchorId;

        for (const item of dateItems) {
          const element = document.getElementById(item.data.anchorId);
          if (!element) {
            continue;
          }

          if (element.getBoundingClientRect().top <= 180) {
            currentAnchor = item.data.anchorId;
          }
        }

        setActiveDateAnchor(currentAnchor);
        frameId = null;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [dateItems, enabled]);

  return activeDateAnchor;
}
