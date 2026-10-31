-- Owner: identity
-- Purpose: user accounts, credentials, sessions and platform roles.
-- Only the identity module may read or write the `identity` schema.

CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE identity.users (
  id                uuid        PRIMARY KEY,
  email             text        NOT NULL CHECK (char_length(email) <= 254),
  -- Lower-cased, trimmed form used for uniqueness and lookup.
  email_normalized  text        NOT NULL CHECK (char_length(email_normalized) <= 254),
  email_verified_at timestamptz,
  display_name      text        NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  status            text        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'suspended', 'deactivated')),
  -- Globalization preferences. No country/currency/language is assumed.
  locale            text        NOT NULL DEFAULT 'en' CHECK (char_length(locale) <= 35),
  timezone          text        NOT NULL DEFAULT 'UTC' CHECK (char_length(timezone) <= 64),
  country_code      char(2)     CHECK (country_code ~ '^[A-Z]{2}$'),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_normalized_uq ON identity.users (email_normalized);

-- Credentials are separate from the account so additional factors
-- (passkeys/WebAuthn, OIDC identities, TOTP) can be added without reshaping users.
CREATE TABLE identity.password_credentials (
  user_id       uuid        PRIMARY KEY REFERENCES identity.users (id) ON DELETE CASCADE,
  password_hash text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Opaque, server-side sessions. Only a SHA-256 hash of the bearer token is stored.
CREATE TABLE identity.sessions (
  id             uuid        PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES identity.users (id) ON DELETE CASCADE,
  token_hash     bytea       NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at     timestamptz,
  revoked_reason text,
  ip             inet,
  user_agent     text        CHECK (char_length(user_agent) <= 512)
);

CREATE UNIQUE INDEX sessions_token_hash_uq ON identity.sessions (token_hash);
CREATE INDEX sessions_user_active_idx ON identity.sessions (user_id, created_at DESC)
  WHERE revoked_at IS NULL;

-- Platform-level roles (RBAC). Organization-scoped roles will live with the
-- organization domain when it exists.
CREATE TABLE identity.user_roles (
  user_id    uuid        NOT NULL REFERENCES identity.users (id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role ~ '^[a-z][a-z_]{1,62}$'),
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid        REFERENCES identity.users (id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role)
);
