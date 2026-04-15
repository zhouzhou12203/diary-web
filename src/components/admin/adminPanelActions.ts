import type { DiaryEntry } from '../../types/index.ts';
import { parseEntriesBackup } from '../../utils/importUtils';
import {
  buildDiaryBackupFileName,
  createDiaryExportPayload,
  downloadBlobFile,
} from '../../utils/exportUtils';

export function exportEntriesToJson(entries: DiaryEntry[]) {
  const blob = new Blob([JSON.stringify(createDiaryExportPayload({
    entries,
    exportType: '全部日记',
    includeHidden: true,
  }), null, 2)], {
    type: 'application/json',
  });

  downloadBlobFile(blob, `${buildDiaryBackupFileName()}.json`);
}

export { parseEntriesBackup };
