-- Owner: identity (identity.one_time_tokens), platform (platform.email_outbox)
-- Purpose: single-use tokens for email verification / password reset, and a
-- transactional email outbox delivered asynchronously by the worker.

-- Only the SHA-256 hash of each token is stored. Tokens are single-use and short-lived.
CREATE TABLE identity.one_time_tokens (
  id          uuid        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES identity.users (id) ON DELETE CASCADE,
  purpose     text        NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
  token_hash  bytea       NOT NULL,
  -- The address the token was sent to; verification only succeeds if it is still the user's email.
  email       text        NOT NULL CHECK (char_length(email) <= 254),
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE UNIQUE INDEX one_time_tokens_hash_uq ON identity.one_time_tokens (token_hash);
CREATE INDEX one_time_tokens_user_purpose_idx ON identity.one_time_tokens (user_id, purpose)
  WHERE consumed_at IS NULL;

-- Emails are enqueued in the same transaction as the state change that triggers
-- them and sent by the worker with retries. Bodies may contain one-time links,
-- so they are cleared as soon as the message is sent or dead-lettered.
CREATE TABLE platform.email_outbox (
  id                  uuid        PRIMARY KEY,
  to_address          text        NOT NULL CHECK (char_length(to_address) <= 254),
  template            text        NOT NULL,
  locale              text        NOT NULL,
  subject             text        NOT NULL,
  text_body           text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  attempts            integer     NOT NULL DEFAULT 0,
  next_attempt_at     timestamptz NOT NULL DEFAULT now(),
  last_error          text,
  sent_at             timestamptz,
  dead_lettered_at    timestamptz,
  provider_message_id text
);

CREATE INDEX email_outbox_pending_idx ON platform.email_outbox (next_attempt_at, created_at)
  WHERE sent_at IS NULL AND dead_lettered_at IS NULL;
