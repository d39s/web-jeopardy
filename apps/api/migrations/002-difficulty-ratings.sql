ALTER TABLE questions
  ADD COLUMN source_level smallint CHECK (source_level BETWEEN 1 AND 9),
  ADD COLUMN difficulty_score numeric(3,1) CHECK (difficulty_score BETWEEN 1 AND 9),
  ADD COLUMN fits_votes integer NOT NULL DEFAULT 0 CHECK (fits_votes >= 0),
  ADD COLUMN too_hard_votes integer NOT NULL DEFAULT 0 CHECK (too_hard_votes >= 0),
  ADD COLUMN too_easy_votes integer NOT NULL DEFAULT 0 CHECK (too_easy_votes >= 0),
  ADD COLUMN unsure_votes integer NOT NULL DEFAULT 0 CHECK (unsure_votes >= 0);

UPDATE questions SET source_level = level, difficulty_score = level;
ALTER TABLE questions ALTER COLUMN source_level SET NOT NULL,
  ALTER COLUMN difficulty_score SET NOT NULL;

-- Historie bleibt auch nach Inhaltsänderungen erhalten. Keine personenbezogenen Daten.
CREATE TABLE difficulty_votes (
  request_id uuid PRIMARY KEY,
  topic_id varchar(64) NOT NULL,
  question_id varchar(64) NOT NULL,
  question_version varchar(64) NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('fits', 'too-hard', 'too-easy', 'unsure')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX difficulty_votes_by_question ON difficulty_votes(topic_id, question_id);