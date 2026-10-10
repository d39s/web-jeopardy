CREATE TABLE topics (
  id varchar(64) PRIMARY KEY,
  title varchar(80) NOT NULL,
  description varchar(300),
  author varchar(80),
  locale varchar(20),
  position integer NOT NULL CHECK (position >= 0)
);

CREATE TABLE rubrics (
  topic_id varchar(64) NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  id varchar(64) NOT NULL,
  name varchar(40) NOT NULL,
  color varchar(9) CHECK (color IN ('#2EC4B6', '#FF7F50', '#B388EB', '#7AE582', '#FFD166')),
  position integer NOT NULL CHECK (position >= 0),
  PRIMARY KEY (topic_id, id),
  UNIQUE (topic_id, position)
);

CREATE TABLE questions (
  topic_id varchar(64) NOT NULL,
  rubric_id varchar(64) NOT NULL,
  id varchar(64) NOT NULL,
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 9),
  question varchar(500) NOT NULL CHECK (length(trim(question)) > 0),
  answer varchar(500) NOT NULL CHECK (length(trim(answer)) > 0),
  note varchar(500),
  position integer NOT NULL CHECK (position >= 0),
  PRIMARY KEY (topic_id, id),
  FOREIGN KEY (topic_id, rubric_id) REFERENCES rubrics(topic_id, id) ON DELETE CASCADE,
  UNIQUE (topic_id, rubric_id, position)
);

CREATE INDEX questions_by_rubric_level ON questions(topic_id, rubric_id, level);

-- Einmalige Initialbefüllung: ein Neustart überschreibt keine gepflegten Fragen.
CREATE TABLE content_imports (
  name text PRIMARY KEY,
  imported_at timestamptz NOT NULL DEFAULT now()
);