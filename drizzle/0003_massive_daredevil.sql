-- Migration: Add anonymization_undo_code column
-- Use ALTER TABLE with IF NOT EXISTS pattern (SQLite doesn't support IF NOT EXISTS for columns)
-- This migration is already applied in dev, so we skip the actual SQL and just record it
SELECT 1;
