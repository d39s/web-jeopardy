import { createDefaultTeams, createTeam } from '@jeopardy/game-core';
import type { GameDefinition, Team, TopicIndexEntry } from '@jeopardy/game-core';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { fetchTopic, fetchTopicIndex, parseUploadedFile } from '../../content/loader';
import type { LoadError } from '../../content/loader';
import { de } from '../../i18n/de';
import { useDispatch, useGameState } from '../../state/GameProvider';
import { loadLastTeams, saveLastTeams } from '../../state/persistence';
import { ShareSection } from './ShareSection';
import { SharedConfigDialog } from './SharedConfigDialog';
import type { SharedConfigResult } from './SharedConfigDialog';
import { TeamSetup } from './TeamSetup';
import { RulesSetup } from './RulesSetup';
import { TimerSetup } from './TimerSetup';
import { TopicPicker } from './TopicPicker';
import { VetoSetup, effectiveVetoSetting } from './VetoSetup';
import { buildShareLink, clearShareParams, parseShareParams } from './shareConfig';

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
  const location = useLocation();

  const [teams, setTeams] = useState<Team[]>(() => loadLastTeams() ?? createDefaultTeams(2));
  const [topics, setTopics] = useState<TopicIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<GameDefinition | null>(null);
  const [starting, setStarting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [deductOnWrong, setDeductOnWrong] = useState(true);
  // null koppelt die Veto-Zeit an die Bedenkzeit – das ist der Standard.
  const [vetoSeconds, setVetoSeconds] = useState<number | null>(null);

  /**
   * Der geteilte Link wird genau einmal beim ersten Rendern ausgewertet. Danach
   * steuert allein der Zustand den Dialog – das Entfernen der Parameter aus der
   * Adresszeile öffnet ihn also nicht erneut.
   */
  const [sharedLink] = useState(() => parseShareParams(location.search));
  const [sharedOpen, setSharedOpen] = useState(sharedLink.status === 'ok');

  useEffect(() => {
    // Aus einem unbrauchbaren Link ist nichts zu holen – Adresszeile aufräumen.
    if (sharedLink.status === 'invalid') clearShareParams();
  }, [sharedLink.status]);

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

  /** Ohne Bedenkzeit ist eine eigene Veto-Zeit gegenstandslos – siehe VetoSetup. */
  const startVetoSeconds = effectiveVetoSetting(vetoSeconds, timerSeconds);

  /**
   * Ein selbst geladenes Fragenset passt nicht in eine Adresszeile – dann gibt
   * es keinen Link. Sonst spiegelt er immer die aktuell eingestellten Werte.
   */
  const shareLink =
    uploaded !== null || selectedId === null
      ? null
      : buildShareLink(
          {
            topicId: selectedId,
            teamNames: normalizeTeams(teams).map((team) => team.name),
            timerSeconds,
            vetoSeconds: startVetoSeconds,
            deductOnWrong,
          },
          globalThis.location?.href ?? '',
        );

  const closeShared = () => {
    setSharedOpen(false);
    clearShareParams();
  };

  const applyShared = (result: SharedConfigResult) => {
    if (result.topicId !== null) {
      setSelectedId(result.topicId);
      setUploaded(null);
    }
    setTeams(result.teams);
    setTimerSeconds(result.timerSeconds);
    setVetoSeconds(result.vetoSeconds);
    setDeductOnWrong(result.deductOnWrong);
    closeShared();
  };

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
    dispatch({
      type: 'game/start',
      definition,
      teams: normalized,
      timerSeconds,
      vetoSeconds: startVetoSeconds,
      deductOnWrong,
    });
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

      <VetoSetup value={vetoSeconds} timerSeconds={timerSeconds} onChange={setVetoSeconds} />

      <RulesSetup deductOnWrong={deductOnWrong} onChange={setDeductOnWrong} />

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

      <ShareSection
        link={shareLink}
        uploadWarning={uploaded !== null}
        invalidLink={sharedLink.status === 'invalid'}
      />

      {sharedLink.status === 'ok' ? (
        <SharedConfigDialog
          // Erst öffnen, wenn der Themenindex da ist – sonst fehlt der Titel.
          open={sharedOpen && !loading}
          config={sharedLink.config}
          topics={topics}
          fallbackTeams={teams}
          onConfirm={applyShared}
          onDismiss={closeShared}
        />
      ) : null}

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
