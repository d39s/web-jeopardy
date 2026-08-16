import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { GameAction, GameState, GameTransport } from '@jeopardy/game-core';
import { clearPersistedState, loadPersistedState, persistState } from './persistence';
import { createLocalTransport } from './transport';

const TransportContext = createContext<GameTransport | null>(null);

const AUTOSAVE_DELAY_MS = 200;

export interface GameProviderProps {
  children: ReactNode;
  /** Für Tests: ein vorbereiteter Transport statt des lokalen Standards. */
  transport?: GameTransport;
  persist?: boolean;
}

/** Erzeugt den Standard-Transport und übernimmt dabei einen gespeicherten Spielstand. */
export function createDefaultTransport(): GameTransport {
  return createLocalTransport(loadPersistedState() ?? undefined);
}

export function GameProvider({ children, transport, persist = true }: GameProviderProps) {
  const activeTransport = useMemo(() => transport ?? createDefaultTransport(), [transport]);

  useEffect(() => {
    if (!persist) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = activeTransport.subscribe((state) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (state.phase === 'setup') {
          clearPersistedState();
        } else {
          persistState(state);
        }
      }, AUTOSAVE_DELAY_MS);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [activeTransport, persist]);

  return <TransportContext value={activeTransport}>{children}</TransportContext>;
}

export function useTransport(): GameTransport {
  const transport = useContext(TransportContext);
  if (!transport) {
    throw new Error('useTransport muss innerhalb von GameProvider verwendet werden.');
  }
  return transport;
}

/**
 * Der Reducer liefert bei unveränderten Daten dieselbe Referenz zurück, daher
 * genügt useSyncExternalStore ohne zusätzliche Vergleichslogik.
 */
export function useGameState(): GameState {
  const transport = useTransport();
  return useSyncExternalStore(transport.subscribe, transport.getState, transport.getState);
}

export function useDispatch(): (action: GameAction) => void {
  return useTransport().dispatch;
}
