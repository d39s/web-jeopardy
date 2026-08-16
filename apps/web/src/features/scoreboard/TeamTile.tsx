import { MAX_TEAM_NAME_LENGTH } from '@jeopardy/game-core';
import type { Team } from '@jeopardy/game-core';
import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { TextField } from '../../components/ui/TextField';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';
import { useDispatch } from '../../state/GameProvider';

export interface TeamTileProps {
  team: Team;
  score: number;
  /** Team am Zug – ruhige Hervorhebung plus Abzeichen, nie nur über die Farbe. */
  isOnTurn?: boolean;
}

/** Teamname ist direkt am Spielfeld editierbar; die Punktebuttons folgen sofort. */
export function TeamTile({ team, score, isOnTurn = false }: TeamTileProps) {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(team.name);

  useEffect(() => setDraft(team.name), [team.name]);

  const commit = () => {
    const next = draft.trim();
    if (!next) {
      setDraft(team.name);
      return;
    }
    if (next !== team.name) {
      dispatch({ type: 'team/rename', teamId: team.id, name: next });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
  };

  return (
    <Card
      // Das Team am Zug ist das "aktuelle" Element der Teamleiste.
      aria-current={isOnTurn ? 'true' : undefined}
      className={cn(
        'flex items-center justify-between gap-2 px-4 py-3 transition-colors',
        isOnTurn && 'border-cat-1 bg-surface-hi',
      )}
    >
      {/* Das Namensfeld bekommt den freien Platz; Abzeichen und Punktestand behalten ihre Breite. */}
      <div className="min-w-0 flex-1">
        <TextField
          label={de.board.teamNameLabel(team.name)}
          hideLabel
          value={draft}
          maxLength={MAX_TEAM_NAME_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-full min-w-0 border-transparent bg-transparent px-1 py-0 font-semibold"
        />
      </div>
      {/*
        Das Abzeichen sitzt in derselben Zeile wie Name und Punktestand – die
        Teamleiste wird dadurch nicht höher. Es bleibt bewusst schmal, damit der
        Teamname auch bei vielen Teams lesbar bleibt. Größe und Farbe brauchen
        `!`, weil `cn` widersprüchliche Utilities nicht auflöst.
      */}
      {isOnTurn ? (
        <Badge className="shrink-0 border-cat-1 px-2! py-0.5! text-xs! font-semibold text-text! uppercase">
          {de.board.turnBadge}
        </Badge>
      ) : null}

      <p className="text-3xl font-bold tabular-nums" aria-hidden="true">
        {score}
      </p>
      <span className="sr-only" aria-live="polite">
        {de.board.scoreLabel(team.name, score)}
      </span>
    </Card>
  );
}
