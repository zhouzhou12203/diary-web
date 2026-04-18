-- Run this once for existing D1 databases created before the local-first sync upgrade.
-- New deployments that execute schema.sql from scratch do not need this file separately.

ALTER TABLE diary_entries ADD COLUMN entry_uuid TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_diary_entries_entry_uuid
ON diary_entries(entry_uuid);
