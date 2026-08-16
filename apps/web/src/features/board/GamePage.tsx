import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { de } from '../../i18n/de';
import { useDispatch, useGameState } from '../../state/GameProvider';
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

  // Ohne laufendes Spiel gehört der Nutzer auf die Startseite.
  useEffect(() => {
    if (!hasGame) void navigate('/', { replace: true });
  }, [hasGame, navigate]);

  const newGame = useCallback(() => {
    if (!window.confirm(de.board.newGameConfirm)) return;
    dispatch({ type: 'game/reset' });
    void navigate('/');
  }, [dispatch, navigate]);

  if (!state.definition) return null;

  return (
    <main className="flex h-full flex-col gap-3 p-3 sm:gap-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{state.definition.title}</h1>
        <div className="flex gap-2">
          <Button onClick={fullscreen.toggle}>
            {fullscreen.active ? de.board.exitFullscreen : de.board.fullscreen}
          </Button>
          <Button onClick={newGame}>{de.board.newGame}</Button>
        </div>
      </header>

      <Scoreboard />
      <BoardGrid />

      <ClueDialog />
      <ResultOverlay onNewGame={newGame} />
    </main>
  );
}
