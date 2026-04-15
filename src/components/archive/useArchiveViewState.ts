import { useEffect, useMemo, useState } from 'react';
import type { ArchiveGroup } from './archiveTypes';

export function useArchiveExpansionState(archiveGroups: ArchiveGroup[]) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(new Set());

  const allGroupKeys = useMemo(() => archiveGroups.map((group) => group.key), [archiveGroups]);
  const allSubGroupKeys = useMemo(
    () => archiveGroups.flatMap((group) => group.subGroups?.map((subGroup) => subGroup.key) || []),
    [archiveGroups]
  );

  useEffect(() => {
    setExpandedGroups((previous) => {
      if (previous.size === 0) {
        return new Set(allGroupKeys);
      }

      const next = new Set(Array.from(previous).filter((key) => allGroupKeys.includes(key)));
      allGroupKeys.forEach((key) => {
        if (!previous.has(key)) {
          next.add(key);
        }
      });
      return next;
    });

    setExpandedSubGroups((previous) => {
      if (previous.size === 0) {
        return new Set(allSubGroupKeys);
      }

      const next = new Set(Array.from(previous).filter((key) => allSubGroupKeys.includes(key)));
      allSubGroupKeys.forEach((key) => {
        if (!previous.has(key)) {
          next.add(key);
        }
      });
      return next;
    });
  }, [allGroupKeys, allSubGroupKeys]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const toggleSubGroup = (subGroupKey: string) => {
    setExpandedSubGroups((previous) => {
      const next = new Set(previous);
      if (next.has(subGroupKey)) {
        next.delete(subGroupKey);
      } else {
        next.add(subGroupKey);
      }
      return next;
    });
  };

  const allExpanded =
    allGroupKeys.length > 0 && allGroupKeys.every((key) => expandedGroups.has(key));

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedGroups(new Set());
      setExpandedSubGroups(new Set());
      return;
    }

    setExpandedGroups(new Set(allGroupKeys));
    setExpandedSubGroups(new Set(allSubGroupKeys));
  };

  return {
    expandedGroups,
    expandedSubGroups,
    allExpanded,
    toggleExpandAll,
    toggleGroup,
    toggleSubGroup,
  };
}

export function useArchiveHighlightScroll(highlightEntryId?: number | null) {
  useEffect(() => {
    if (!highlightEntryId) {
      return;
    }

    const targetElement = document.getElementById(`entry-${highlightEntryId}`);
    if (!targetElement) {
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const inViewport = rect.top >= 96 && rect.bottom <= window.innerHeight - 48;

    if (!inViewport) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightEntryId]);
}
