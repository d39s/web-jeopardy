-- Vorlage fuer manuelle PostgreSQL-Inhaltsergaenzungen; keine Migration.
-- Eingabebloecke mit echten Werten fuellen. Leer ist die Vorlage absichtlich ungueltig.
-- Keine bestehenden Themen, Fragen, Scores oder Historien aendern.
BEGIN;
SELECT pg_advisory_xact_lock(391002);
LOCK TABLE topics, rubrics, questions IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE input_topics (
  id varchar(64) PRIMARY KEY,
  title varchar(80) NOT NULL,
  description varchar(300),
  author varchar(80),
  locale varchar(20)
) ON COMMIT DROP;
CREATE TEMP TABLE input_rubrics (
  topic_id varchar(64) NOT NULL,
  id varchar(64) NOT NULL,
  name varchar(40) NOT NULL,
  color varchar(9),
  PRIMARY KEY (topic_id, id)
) ON COMMIT DROP;
CREATE TEMP TABLE input_questions (
  topic_id varchar(64) NOT NULL,
  rubric_id varchar(64) NOT NULL,
  id varchar(64) NOT NULL,
  source_level smallint NOT NULL CHECK (source_level BETWEEN 1 AND 9),
  question varchar(500) NOT NULL,
  answer varchar(500) NOT NULL,
  note varchar(500),
  PRIMARY KEY (topic_id, id)
) ON COMMIT DROP;

-- INPUT_TOPICS: Neue Kategorien, bei bestehenden Eltern ohne Metadaten leer lassen.
-- INSERT INTO input_topics (id, title, description, author, locale) VALUES (...);
-- INPUT_RUBRICS: Neue Rubriken, bei bestehenden Eltern nur in Fragen referenzieren.
-- INSERT INTO input_rubrics (topic_id, id, name, color) VALUES (...);
-- INPUT_QUESTIONS: Echte Fragen; Apostrophe als zwei Apostrophe schreiben.
-- INSERT INTO input_questions (topic_id, rubric_id, id, source_level, question, answer, note) VALUES (...);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM input_questions) THEN
    RAISE EXCEPTION 'Keine Fragen geliefert: SQL-Vorlage zuerst ausfuellen.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM input_topics i JOIN topics t USING (id)
    WHERE (i.title, i.description, i.author, i.locale)
      IS DISTINCT FROM (t.title, t.description, t.author, t.locale)
  ) OR EXISTS (
    SELECT 1 FROM input_rubrics i JOIN rubrics r USING (topic_id, id)
    WHERE (i.name, i.color) IS DISTINCT FROM (r.name, r.color)
  ) OR EXISTS (
    SELECT 1 FROM input_questions i JOIN questions q USING (topic_id, id)
    WHERE (i.rubric_id, i.source_level, i.question, i.answer, i.note)
      IS DISTINCT FROM (q.rubric_id, q.source_level, q.question, q.answer, q.note)
  ) THEN
    RAISE EXCEPTION 'ID-Konflikt mit anderem Inhalt; vorhandene Daten bleiben unveraendert.';
  END IF;
  IF EXISTS (
    SELECT id FROM input_topics WHERE id !~ '^[a-z0-9][a-z0-9-]*$' OR length(trim(title)) = 0
    UNION ALL
    SELECT id FROM input_rubrics WHERE id !~ '^[a-z0-9][a-z0-9-]*$'
      OR topic_id !~ '^[a-z0-9][a-z0-9-]*$' OR length(trim(name)) = 0
    UNION ALL
    SELECT id FROM input_questions WHERE id !~ '^[a-z0-9][a-z0-9-]*$'
      OR topic_id !~ '^[a-z0-9][a-z0-9-]*$' OR rubric_id !~ '^[a-z0-9][a-z0-9-]*$'
      OR length(trim(question)) = 0 OR length(trim(answer)) = 0
  ) THEN
    RAISE EXCEPTION 'Ungueltige ID oder leerer Pflichttext.';
  END IF;
END $$;

WITH fresh AS (
  SELECT i.* FROM input_topics i WHERE NOT EXISTS (SELECT 1 FROM topics t WHERE t.id = i.id)
)
INSERT INTO topics (id, title, description, author, locale, position)
SELECT id, title, description, author, locale,
  (SELECT COALESCE(MAX(position), -1) FROM topics) + ROW_NUMBER() OVER (ORDER BY id)
FROM fresh
ON CONFLICT (id) DO NOTHING;

WITH fresh AS (
  SELECT i.* FROM input_rubrics i
  WHERE NOT EXISTS (SELECT 1 FROM rubrics r WHERE r.topic_id = i.topic_id AND r.id = i.id)
)
INSERT INTO rubrics (topic_id, id, name, color, position)
SELECT topic_id, id, name, color,
  COALESCE((SELECT MAX(r.position) FROM rubrics r WHERE r.topic_id = fresh.topic_id), -1)
    + ROW_NUMBER() OVER (PARTITION BY topic_id ORDER BY id)
FROM fresh
ON CONFLICT (topic_id, id) DO NOTHING;

WITH fresh AS (
  SELECT i.* FROM input_questions i
  WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.topic_id = i.topic_id AND q.id = i.id)
)
INSERT INTO questions (
  topic_id, rubric_id, id, level, source_level, difficulty_score, question, answer, note, position,
  fits_votes, too_hard_votes, too_easy_votes, unsure_votes
)
SELECT topic_id, rubric_id, id, source_level, source_level, source_level, question, answer, note,
  COALESCE((SELECT MAX(q.position) FROM questions q
    WHERE q.topic_id = fresh.topic_id AND q.rubric_id = fresh.rubric_id), -1)
    + ROW_NUMBER() OVER (PARTITION BY topic_id, rubric_id ORDER BY id),
  0, 0, 0, 0
FROM fresh
ON CONFLICT (topic_id, id) DO NOTHING;

-- Auch fuer reine Ergaenzungen muss der fertige Gesamtpool spielbar bleiben.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM topics t
    WHERE t.id IN (SELECT id FROM input_topics UNION SELECT topic_id FROM input_rubrics
      UNION SELECT topic_id FROM input_questions)
      AND (SELECT COUNT(*) FROM rubrics r WHERE r.topic_id = t.id) < 5
  ) OR EXISTS (
    SELECT 1 FROM rubrics r
    WHERE r.topic_id IN (SELECT id FROM input_topics UNION SELECT topic_id FROM input_rubrics
      UNION SELECT topic_id FROM input_questions)
      AND (SELECT COUNT(*) FROM questions q
        WHERE q.topic_id = r.topic_id AND q.rubric_id = r.id) < 5
  ) THEN
    RAISE EXCEPTION 'Pool unvollstaendig: mindestens 5 Rubriken mit je 5 Fragen erforderlich.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM rubrics r JOIN questions q ON q.topic_id = r.topic_id AND q.id = r.id
    WHERE r.topic_id IN (SELECT id FROM input_topics UNION SELECT topic_id FROM input_rubrics
      UNION SELECT topic_id FROM input_questions)
  ) THEN
    RAISE EXCEPTION 'Rubrik- und Frage-IDs duerfen sich pro Kategorie nicht ueberschneiden.';
  END IF;
END $$;

-- Weitere Strukturregeln separat mit validateQuestionPool pruefen; gleiche Texte sind erlaubt.
COMMIT;