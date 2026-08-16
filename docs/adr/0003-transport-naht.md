# ADR 0003 – Transport-Naht für den späteren Online-Modus

Status: angenommen · Datum: 2026-08-16

## Kontext

Der Online-Modus ist ausdrücklich für später vorgesehen, soll aber nicht zu einem Umbau der
gesamten Oberfläche führen. Gleichzeitig darf der MVP keinen Server voraussetzen.

## Entscheidung

Zwischen Oberfläche und Spiellogik liegt genau eine Schnittstelle:

```ts
interface GameTransport {
  getState(): GameState;
  dispatch(action: GameAction): void;
  subscribe(listener: (state: GameState) => void): () => void;
}
```

Daraus folgen vier Regeln, die im Code eingehalten und getestet sind:

1. Jede Zustandsänderung ist eine **serialisierbare Action**. Komponenten verändern niemals
   direkt den Zustand.
2. `packages/game-core` enthält **keine** React-, DOM- oder Browser-API und keine Zeit- oder
   Zufallsquelle. Zeitstempel kommen über die Action, Event-IDs ergeben sich aus dem
   Zustand (`clueId:teamId:index`).
3. Phase 1 liefert `createLocalTransport()`, das Actions direkt auf den Reducer anwendet.
4. Phase 2 ergänzt `createWebSocketTransport(url, raumcode)`. Der Server nutzt **denselben**
   Reducer; es gibt keine zweite Regelimplementierung.

## Konsequenzen

- Die Oberfläche muss für den Online-Modus nicht angefasst werden – nur die Erzeugung des
  Transports in `GameProvider` wechselt.
- Der Reducer ist deterministisch wiederholbar, wodurch ein serverseitiges Replay des
  Event-Logs denselben Zustand ergibt.
- Preis dieser Trennung: etwas mehr Zeremonie im MVP (Actions statt direkter Setter) und
  Zeitstempel, die von außen hereingereicht werden müssen.
