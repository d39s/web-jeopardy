import { MAX_TEAM_NAME_LENGTH, createTeam, defaultTeamName, formatSeed } from '@jeopardy/game-core';
import type { Difficulty, Team, TopicCategory, WrongPenalty } from '@jeopardy/game-core';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { de } from '../../i18n/de';
import { DEFAULT_DIFFICULTY } from './DifficultySetup';
import { formatTimerOption } from './TimerSetup';
import { vetoValueText } from './VetoSetup';
import type { SharedConfig } from './shareConfig';

const TITLE_ID = 'geteiltes-spiel-titel';

const RULE_LABELS: Record<WrongPenalty, string> = {
  full: de.setup.sharedRuleFull,
  half: de.setup.sharedRuleHalf,
  none: de.setup.sharedRuleNone,
};

export interface SharedConfigResult {
  /** Kategorie-ID aus dem Link, sofern sie im Index vorkommt. */
  categoryId: string | null;
  /** Reglerstellung aus dem Link; ohne Angabe die Voreinstellung. */
  level: Difficulty;
  /** Ziehungsnummer aus dem Link; null zieht ein neues Spielfeld. */
  seed: number | null;
  teams: Team[];
  timerSeconds: number | null;
  /** Veto-Zeit in Sekunden; null koppelt sie an die Bedenkzeit. */
  vetoSeconds: number | null;
  /** Was eine falsche Antwort kostet. */
  wrongPenalty: WrongPenalty;
}

export interface SharedConfigDialogProps {
  open: boolean;
  config: SharedConfig;
  categories: TopicCategory[];
  /** Namensvorschlag, wenn der Link keine Teams enthält. */
  fallbackTeams: Team[];
  onConfirm: (result: SharedConfigResult) => void;
  onDismiss: () => void;
}

/**
 * Wird beim Öffnen eines geteilten Links gezeigt. Kategorie, Schwierigkeit und
 * Ziehung stehen fest, die Teamnamen müssen vor dem Start bestätigt oder
 * angepasst werden – sonst spielt die nächste Runde unter fremden Namen.
 */
export function SharedConfigDialog({
  open,
  config,
  categories,
  fallbackTeams,
  onConfirm,
  onDismiss,
}: SharedConfigDialogProps) {
  const [names, setNames] = useState<string[]>(() =>
    config.teamNames.length > 0 ? config.teamNames : fallbackTeams.map((team) => team.name),
  );

  const category = categories.find((entry) => entry.id === config.categoryId) ?? null;
  const level = config.level ?? DEFAULT_DIFFICULTY;
  const timerLabel =
    config.timerSeconds === null ? de.setup.timerOff : formatTimerOption(config.timerSeconds);

  const rename = (index: number, name: string) => {
    setNames(names.map((current, position) => (position === index ? name : current)));
  };

  const confirm = () => {
    onConfirm({
      categoryId: category?.id ?? null,
      level,
      seed: config.seed,
      // createTeam kürzt zu lange und ersetzt leere Namen durch den Standard.
      teams: names.map((name, index) => createTeam(index, name)),
      timerSeconds: config.timerSeconds,
      vetoSeconds: config.vetoSeconds,
      wrongPenalty: config.wrongPenalty,
    });
  };

  return (
    <Modal open={open} onClose={onDismiss} labelledBy={TITLE_ID} className="w-[min(36rem,92vw)]">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h2 id={TITLE_ID} className="text-2xl font-bold">
            {de.setup.sharedHeading}
          </h2>
          <p className="text-text-muted">{de.setup.sharedIntro}</p>
        </header>

        <div className="flex flex-wrap gap-2">
          {category ? <Badge>{de.setup.sharedCategory(category.title)}</Badge> : null}
          <Badge>{de.setup.sharedDifficulty(de.setup.difficultyName(level))}</Badge>
          {config.seed === null ? null : (
            <Badge>{de.setup.sharedDraw(formatSeed(config.seed))}</Badge>
          )}
          <Badge>{de.setup.sharedTimer(timerLabel)}</Badge>
          <Badge>
            {de.setup.sharedVeto(vetoValueText(config.vetoSeconds, config.timerSeconds))}
          </Badge>
          <Badge>{RULE_LABELS[config.wrongPenalty]}</Badge>
        </div>

        {/* Unbekannte Kategorie: der Rest des Links bleibt trotzdem nutzbar. */}
        {category ? null : <p className="text-sm text-negative">{de.setup.sharedInvalid}</p>}

        <ul className="flex flex-col gap-3">
          {names.map((name, index) => (
            <li key={`geteiltes-team-${index}`}>
              <TextField
                label={de.setup.teamLabel(index)}
                value={name}
                maxLength={MAX_TEAM_NAME_LENGTH}
                placeholder={defaultTeamName(index)}
                onChange={(event) => rename(index, event.target.value)}
              />
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onDismiss}>{de.setup.sharedDiscard}</Button>
          <Button variant="primary" onClick={confirm}>
            {de.setup.sharedConfirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
