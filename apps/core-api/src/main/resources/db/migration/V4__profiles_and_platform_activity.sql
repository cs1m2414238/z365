CREATE UNIQUE INDEX users_username_lower_key ON users (lower(username));
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

CREATE TABLE user_profiles (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(50) NOT NULL,
    bio VARCHAR(180) NOT NULL DEFAULT '',
    location VARCHAR(45) NOT NULL DEFAULT '',
    college VARCHAR(70) NOT NULL DEFAULT '',
    role_label VARCHAR(60) NOT NULL DEFAULT 'Developer',
    github_url VARCHAR(200) NOT NULL DEFAULT '',
    linkedin_url VARCHAR(200) NOT NULL DEFAULT '',
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),
    is_public BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO user_profiles (user_id, display_name)
SELECT id, username FROM users;

CREATE TABLE user_profile_skills (
    user_id VARCHAR(36) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    name VARCHAR(40) NOT NULL,
    PRIMARY KEY (user_id, name)
);

CREATE TABLE platform_accounts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(16) NOT NULL,
    handle VARCHAR(50) NOT NULL,
    verification_code VARCHAR(48),
    verified_at TIMESTAMPTZ,
    provider_id VARCHAR(80),
    rating INTEGER CHECK (rating >= 0),
    last_synced_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    lease_id VARCHAR(36),
    failures INTEGER NOT NULL DEFAULT 0,
    last_error VARCHAR(200),
    coverage_from DATE,
    UNIQUE (user_id, platform)
);

CREATE UNIQUE INDEX platform_verified_identity_key
    ON platform_accounts (platform, provider_id) WHERE verified_at IS NOT NULL;
CREATE INDEX platform_sync_due_idx ON platform_accounts (next_sync_at)
    WHERE next_sync_at IS NOT NULL;

CREATE TABLE external_activity (
    account_id VARCHAR(36) NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
    provider_event_id VARCHAR(80) NOT NULL,
    occurred_on DATE NOT NULL,
    solved_problem VARCHAR(120),
    PRIMARY KEY (account_id, provider_event_id)
);
CREATE INDEX external_activity_account_day_idx ON external_activity (account_id, occurred_on);
