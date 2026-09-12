import { createDefaultTeams, createSeed, createTeam, drawBoard } from '@jeopardy/game-core';
import type {
  Difficulty,
  GameDefinition,
  QuestionPool,
  Team,
  TopicCategory,
  WrongPenalty,
} from '@jeopardy/game-core';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BuildInfo } from '../../components/BuildInfo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { fetchPool, fetchTopicIndex, parseUploadedFile } from '../../content/loader';
import type { LoadError } from '../../content/loader';
import { de } from '../../i18n/de';
import { useDispatch, useGameState } from '../../state/GameProvider';
import { loadLastSetup, saveLastSetup } from '../../state/persistence';
import { DEFAULT_DIFFICULTY, DifficultySetup } from './DifficultySetup';
import { DrawSetup } from './DrawSetup';
import { ShareSection } from './ShareSection';
import { SharedConfigDialog } from './SharedConfigDialog';
import type { SharedConfigResult } from './SharedConfigDialog';
import { TeamSetup } from './TeamSetup';
import { RulesSetup } from './RulesSetup';
import { TimerSetup } from './TimerSetup';
import { TopicPicker } from './TopicPicker';
import { UploadSection } from './UploadSection';
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

  /**
   * Einstellungen der letzten Partie. Sie füllen die Seite vor, damit eine
   * weitere Runde nicht alles erneut verlangt – das Spielfeld ausgenommen, das
   * jede Partie neu zieht. Einmal beim Aufbau gelesen; danach zählt allein die
   * Eingabe auf dieser Seite.
   */
  const [lastSetup] = useState(loadLastSetup);

  const [teams, setTeams] = useState<Team[]>(() =>
    lastSetup && lastSetup.teams.length > 0 ? lastSetup.teams : createDefaultTeams(2),
  );
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    lastSetup?.categoryId ?? null,
  );
  const [pool, setPool] = useState<QuestionPool | null>(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const [uploaded, setUploaded] = useState<GameDefinition | null>(null);
  const [starting, setStarting] = useState(false);
  const [level, setLevel] = useState<Difficulty>(lastSetup?.level ?? DEFAULT_DIFFICULTY);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(lastSetup?.timerSeconds ?? null);
  const [wrongPenalty, setWrongPenalty] = useState<WrongPenalty>(lastSetup?.wrongPenalty ?? 'full');
  // null koppelt die Veto-Zeit an die Bedenkzeit – das ist der Standard.
  const [vetoSeconds, setVetoSeconds] = useState<number | null>(lastSetup?.vetoSeconds ?? null);

  /**
   * Nummer der Ziehung. Sie entsteht beim Aufbau der Seite, steht im geteilten
   * Link und lässt sich von Hand neu würfeln – jede neue Partie beginnt also
   * mit einem frischen Brett, ein geteilter Link aber mit demselben.
   */
  const [seed, setSeed] = useState<number>(createSeed);

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
        setCategories(result.data.categories);
      } else {
        setError(result.error);
      }
    });

    return () => controller.abort();
  }, []);

  /**
   * Der Vorrat wird erst mit der Kategorie geladen: Er ist um ein Vielfaches
   * größer als der Index und für die erste Auswahlstufe nicht nötig.
   */
  useEffect(() => {
    const category = categories.find((entry) => entry.id === selectedCategory);
    if (!category) {
      setPool(null);
      // Ein gemerktes Thema, das der Index nicht mehr kennt, führt zurück zur Auswahl.
      if (selectedCategory !== null && categories.length > 0) setSelectedCategory(null);
      return;
    }

    const controller = new AbortController();
    setPoolLoading(true);

    void fetchPool(category.file, category.title, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setPoolLoading(false);
      if (result.ok) {
        setPool(result.data);
        setError(null);
      } else {
        setPool(null);
        setError(result.error);
      }
    });

    return () => controller.abort();
  }, [categories, selectedCategory]);

  const resumable = state.definition !== null && state.phase !== 'setup';
  const canStart = uploaded !== null || pool !== null;

  /**
   * Ein gemerktes Thema kann aus dem Index verschwunden sein. Regler und
   * Ziehung gehören dann nicht auf die Seite: Die Auswahl beginnt von vorn.
   */
  const knownCategory = categories.some((entry) => entry.id === selectedCategory);

  /** Ohne Bedenkzeit ist eine eigene Veto-Zeit gegenstandslos – siehe VetoSetup. */
  const startVetoSeconds = effectiveVetoSetting(vetoSeconds, timerSeconds);

  /**
   * Ein selbst geladenes Fragenset passt nicht in eine Adresszeile – dann gibt
   * es keinen Link. Sonst spiegelt er immer die aktuell eingestellten Werte,
   * die Ziehungsnummer eingeschlossen.
   */
  const shareLink =
    uploaded !== null || selectedCategory === null
      ? null
      : buildShareLink(
          {
            categoryId: selectedCategory,
            level,
            seed,
            teamNames: normalizeTeams(teams).map((team) => team.name),
            timerSeconds,
            vetoSeconds: startVetoSeconds,
            wrongPenalty,
          },
          globalThis.location?.href ?? '',
        );

  const closeShared = () => {
    setSharedOpen(false);
    clearShareParams();
  };

  const applyShared = (result: SharedConfigResult) => {
    if (result.categoryId !== null) {
      setSelectedCategory(result.categoryId);
      setUploaded(null);
    }
    setLevel(result.level);
    // Ohne Nummer im Link bleibt die eigene – dann gibt es ein frisches Brett.
    if (result.seed !== null) setSeed(result.seed);
    setTeams(result.teams);
    setTimerSeconds(result.timerSeconds);
    setVetoSeconds(result.vetoSeconds);
    setWrongPenalty(result.wrongPenalty);
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

  const start = () => {
    setStarting(true);
    setError(null);

    // Ein hochgeladenes Fragenset ist ein fertiges Brett und wird nicht gezogen.
    let definition = uploaded;
    if (definition === null && pool !== null) {
      const drawn = drawBoard({ pool, level, seed });
      if (!drawn.ok) {
        setError({ kind: 'invalid', message: de.errors.drawFailed, issues: [] });
        setStarting(false);
        return;
      }
      definition = drawn.definition;
    }

    setStarting(false);
    if (definition === null) return;

    const normalized = normalizeTeams(teams);
    saveLastSetup({
      teams: normalized,
      // Ein hochgeladenes Fragenset hat kein Thema aus dem Index.
      categoryId: uploaded !== null ? null : selectedCategory,
      level,
      timerSeconds,
      vetoSeconds,
      wrongPenalty,
    });
    dispatch({
      type: 'game/start',
      definition,
      teams: normalized,
      timerSeconds,
      vetoSeconds: startVetoSeconds,
      wrongPenalty,
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

      <RulesSetup wrongPenalty={wrongPenalty} onChange={setWrongPenalty} />

      <TopicPicker
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        pool={pool}
        poolLoading={poolLoading}
        loading={loading}
        error={error}
      />

      {/* Regler und Ziehung betreffen nur gezogene Bretter, nicht den Upload. */}
      {uploaded === null && knownCategory ? (
        <>
          <DifficultySetup value={level} onChange={setLevel} />
          <DrawSetup seed={seed} onReshuffle={() => setSeed(createSeed())} />
        </>
      ) : null}

      <UploadSection uploaded={uploaded} onUpload={(file) => void handleUpload(file)} />

      <ShareSection
        link={shareLink}
        uploadWarning={uploaded !== null}
        invalidLink={sharedLink.status === 'invalid'}
      />

      {sharedLink.status === 'ok' ? (
        <SharedConfigDialog
          // Erst öffnen, wenn der Index da ist – sonst fehlt der Kategorietitel.
          open={sharedOpen && !loading}
          config={sharedLink.config}
          categories={categories}
          fallbackTeams={teams}
          onConfirm={applyShared}
          onDismiss={closeShared}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" size="lg" disabled={!canStart || starting} onClick={start}>
          {de.setup.start}
        </Button>
        {canStart ? null : <p className="text-sm text-text-muted">{de.setup.startHint}</p>}
      </div>

      <BuildInfo />
    </main>
  );
}
