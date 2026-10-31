-- Owner: platform
-- Purpose: shared platform infrastructure tables (event outbox, security audit log).
-- Domain data never lives in these schemas.

CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS audit;

-- Transactional outbox. Domain modules append events in the same transaction
-- as their state change; the outbox relay publishes them (at-least-once) to the
-- event bus (Kafka in the target architecture). PostgreSQL stays the source of truth.
CREATE TABLE platform.outbox_events (
  id               uuid        PRIMARY KEY,
  aggregate_type   text        NOT NULL,
  aggregate_id     uuid        NOT NULL,
  event_type       text        NOT NULL,
  event_version    integer     NOT NULL CHECK (event_version > 0),
  payload          jsonb       NOT NULL,
  metadata         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  occurred_at      timestamptz NOT NULL,
  published_at     timestamptz,
  attempts         integer     NOT NULL DEFAULT 0,
  next_attempt_at  timestamptz NOT NULL DEFAULT now(),
  last_error       text,
  dead_lettered_at timestamptz
);

CREATE INDEX outbox_events_pending_idx
  ON platform.outbox_events (next_attempt_at, occurred_at)
  WHERE published_at IS NULL AND dead_lettered_at IS NULL;

CREATE INDEX outbox_events_aggregate_idx
  ON platform.outbox_events (aggregate_type, aggregate_id, occurred_at);

-- Append-only security audit trail (authentication, session and authorization events).
CREATE TABLE audit.security_events (
  id            uuid        PRIMARY KEY,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  action        text        NOT NULL,
  outcome       text        NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  actor_user_id uuid,
  subject_id    text,
  ip            inet,
  user_agent    text,
  request_id    text,
  details       jsonb       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX security_events_actor_idx ON audit.security_events (actor_user_id, occurred_at DESC);
CREATE INDEX security_events_action_idx ON audit.security_events (action, occurred_at DESC);
CREATE INDEX security_events_subject_idx ON audit.security_events (subject_id, action, occurred_at DESC);

-- Audit rows are immutable once written.
CREATE FUNCTION audit.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit.security_events is append-only';
END;
$$;

CREATE TRIGGER security_events_append_only
  BEFORE UPDATE OR DELETE ON audit.security_events
  FOR EACH ROW EXECUTE FUNCTION audit.reject_mutation();
