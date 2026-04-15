import { beforeEach, describe, expect, it } from 'vitest';
import { clearOfflineEntrySnapshot, readOfflineEntrySnapshot, writeOfflineEntrySnapshot } from './offlineEntrySnapshot';

describe('offlineEntrySnapshot', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores only public entries for offline reading', () => {
    writeOfflineEntrySnapshot([
      {
        id: 1,
        title: '公开内容',
        content: '可离线查看',
        hidden: false,
      },
      {
        id: 2,
        title: '隐藏内容',
        content: '不应写入快照',
        hidden: true,
      },
    ]);

    const snapshot = readOfflineEntrySnapshot();

    expect(snapshot).not.toBeNull();
    expect(snapshot?.entries).toHaveLength(1);
    expect(snapshot?.entries[0].title).toBe('公开内容');
    expect(snapshot?.entries[0].hidden).toBe(false);
  });

  it('clears snapshots when requested', () => {
    writeOfflineEntrySnapshot([
      {
        id: 1,
        title: '公开内容',
        content: '可离线查看',
        hidden: false,
      },
    ]);

    clearOfflineEntrySnapshot();
    expect(readOfflineEntrySnapshot()).toBeNull();
  });
});
