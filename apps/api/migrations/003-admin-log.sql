-- Protokoll der Admin-Änderungen: wer hat wann welche Frage oder welches SQL-Skript eingespielt.
CREATE TABLE admin_log (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor varchar(200) NOT NULL,
  action varchar(40) NOT NULL,
  target varchar(200),
  detail jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX admin_log_by_time ON admin_log(created_at DESC);
