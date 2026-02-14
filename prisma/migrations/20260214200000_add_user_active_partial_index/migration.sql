-- Partial index for fast lookups of active (non-deleted) users.
-- Queries that filter `deletedAt IS NULL` will use this index.
CREATE INDEX "idx_user_active" ON "User" ("id") WHERE "deletedAt" IS NULL;

-- Partial index for fast lookups of active (non-deleted) events.
CREATE INDEX "idx_event_active" ON "Event" ("id") WHERE "deletedAt" IS NULL;
