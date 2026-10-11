-- Meldungen von Spielern. Eine Frage mit offener Meldung kommt in kein neues Spiel, bis die
-- Meldung im Admin-Bereich aufgehoben ist. Ohne Fremdschlüssel: Ein Poolimport ersetzt die
-- Fragen, die Meldungen bleiben trotzdem bestehen. Keine personenbezogenen Daten.
CREATE TABLE question_reports (
  id bigserial PRIMARY KEY,
  request_id uuid NOT NULL UNIQUE,
  topic_id varchar(64) NOT NULL,
  question_id varchar(64) NOT NULL,
  source text NOT NULL CHECK (source IN ('game', 'review')),
  comment varchar(500),
  -- Stand zum Zeitpunkt der Meldung, falls die Frage danach bearbeitet wird.
  question varchar(500) NOT NULL,
  answer varchar(500) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by varchar(200)
);
CREATE INDEX question_reports_open ON question_reports(topic_id, question_id)
  WHERE resolved_at IS NULL;
