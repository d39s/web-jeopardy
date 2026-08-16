import { createDefaultTeams, createTeam } from '@jeopardy/game-core';
import type { GameDefinition, Team, TopicIndexEntry } from '@jeopardy/game-core';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { fetchTopic, fetchTopicIndex, parseUploadedFile } from '../../content/loader';
import type { LoadError } from '../../content/loader';
import { de } from '../../i18n/de';
import { useDispatch, useGameState } from '../../state/GameProvider';
import { loadLastTeams, saveLastTeams } from '../../state/persistence';
import { TeamSetup } from './TeamSetup';
import { TimerSetup } from './TimerSetup';
import { TopicPicker } from './TopicPicker';

/** Leere Namen fallen auf den Standardnamen der jeweiligen Position zurück. */
function normalizeTeams(teams: Team[]): Team[] {
  return teams.map((team, index) => ({
    ...team,
    name: team.name.trim() || createTeam(index).name,
  }));
}

export function SetupPage() {
  const state = useGameState();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>(() => loadLastTeams() ?? createDefaultTeams(2));
  const [topics, setTopics] = useState<TopicIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<GameDefinition | null>(null);
  const [starting, setStarting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetchTopicIndex(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setLoading(false);
      if (result.ok) {
        setTopics(result.data.topics);
        setSelectedId((current) => current ?? result.data.topics[0]?.id ?? null);
      } else {
        setError(result.error);
      }
    });

    return () => controller.abort();
  }, []);

  const resumable = state.definition !== null && state.phase !== 'setup';
  const canStart = uploaded !== null || selectedId !== null;

  const handleUpload = async (file: File) => {
    const result = await parseUploadedFile(file);
    if (result.ok) {
      setUploaded(result.data);
      setError(null);
    } else {
      setUploaded(null);
      setError(result.error);
    }
  };

  const start = async () => {
    const chosen = topics.find((topic) => topic.id === selectedId);
    setStarting(true);
    setError(null);

    let definition = uploaded;
    if (!definition && chosen) {
      const result = await fetchTopic(chosen.file, chosen.title);
      if (!result.ok) {
        setError(result.error);
        setStarting(false);
        return;
      }
      definition = result.data;
    }

    setStarting(false);
    if (!definition) return;

    const normalized = normalizeTeams(teams);
    saveLastTeams(normalized);
    dispatch({ type: 'game/start', definition, teams: normalized, timerSeconds });
    void navigate('/game');
  };

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-8 p-6 sm:p-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{de.setup.heading}</h1>
        <p className="text-text-muted">{de.setup.intro}</p>
      </header>

      {resumable && state.definition ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="font-semibold">{de.setup.resumeHeading}</p>
            <p className="text-sm text-text-muted">{de.setup.resumeText(state.definition.title)}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => dispatch({ type: 'game/reset' })}>{de.setup.discard}</Button>
            <Button variant="primary" onClick={() => void navigate('/game')}>
              {de.setup.resume}
            </Button>
          </div>
        </Card>
      ) : null}

      <TeamSetup teams={teams} onChange={setTeams} />

      <TimerSetup value={timerSeconds} onChange={setTimerSeconds} />

      <TopicPicker
        topics={topics}
        loading={loading}
        error={error}
        selectedId={selectedId}
        uploaded={uploaded}
        onSelect={(id) => {
          setSelectedId(id);
          setUploaded(null);
        }}
        onUpload={(file) => void handleUpload(file)}
      />

      <footer className="flex flex-wrap items-center gap-4">
        <Button
          variant="primary"
          size="lg"
          disabled={!canStart || starting}
          onClick={() => void start()}
        >
          {de.setup.start}
        </Button>
        {canStart ? null : <p className="text-sm text-text-muted">{de.setup.startHint}</p>}
      </footer>
    </main>
  );
}
