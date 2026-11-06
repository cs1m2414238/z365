ALTER TABLE external_activity
    ADD COLUMN occurred_at TIMESTAMPTZ,
    ADD COLUMN event_kind VARCHAR(30),
    ADD COLUMN title VARCHAR(150);

CREATE INDEX external_activity_recent_idx ON external_activity (account_id, occurred_at DESC)
    WHERE occurred_at IS NOT NULL;
