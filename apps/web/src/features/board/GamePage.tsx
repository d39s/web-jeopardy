import { selectIsFinished } from '@jeopardy/game-core';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { de } from '../../i18n/de';
import { useDispatch, useGameState } from '../../state/GameProvider';
import { saveGamePreset } from '../../state/persistence';
import { ClueDialog } from '../clue/ClueDialog';
import { ResultOverlay } from '../scoreboard/ResultOverlay';
import { Scoreboard } from '../scoreboard/Scoreboard';
import { BoardGrid } from './BoardGrid';

function useFullscreen(): { active: boolean; toggle: () => void } {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const update = () => setActive(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void document.documentElement.requestFullscreen?.();
    }
  }, []);

  return { active, toggle };
}

export function GamePage() {
  const state = useGameState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fullscreen = useFullscreen();

  const hasGame = state.definition !== null && state.phase !== 'setup';
  const finished = selectIsFinished(state);
  // Die Auswertung öffnet sich mit der letzten Wertung von selbst; wer sie
  // schließt, kommt über den Knopf in der Kopfzeile zurück.
  const [resultDismissed, setResultDismissed] = useState(false);

  // Ohne laufendes Spiel gehört der Nutzer auf die Startseite.
  useEffect(() => {
    if (!hasGame) void navigate('/', { replace: true });
  }, [hasGame, navigate]);

  const newGame = useCallback(() => {
    if (!window.confirm(de.board.newGameConfirm)) return;
    saveGamePreset(state);
    dispatch({ type: 'game/reset' });
    void navigate('/');
  }, [dispatch, navigate, state]);

  if (!state.definition) return null;

  return (
    <main className="flex h-full flex-col gap-3 p-3 sm:gap-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{state.definition.title}</h1>
        <nav aria-label="Spielaktionen" className="flex flex-wrap items-center gap-2">
          {finished ? (
            <Button variant="primary" onClick={() => setResultDismissed(false)}>
              {de.board.showResult}
            </Button>
          ) : null}
          <Button className="px-3 py-2 text-sm" onClick={fullscreen.toggle}>
            {fullscreen.active ? de.board.exitFullscreen : de.board.fullscreen}
          </Button>
          <Button className="px-3 py-2 text-sm text-text-muted" onClick={newGame}>
            {de.board.newGame}
          </Button>
        </nav>
      </header>

      <Scoreboard />
      <BoardGrid />

      <ClueDialog />
      <ResultOverlay
        open={finished && !resultDismissed}
        onClose={() => setResultDismissed(true)}
        onNewGame={newGame}
      />
    </main>
  );
}
