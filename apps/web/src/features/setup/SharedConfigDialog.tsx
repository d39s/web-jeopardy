import { MAX_TEAM_NAME_LENGTH, createTeam, defaultTeamName } from '@jeopardy/game-core';
import type { Team, TopicIndexEntry } from '@jeopardy/game-core';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { de } from '../../i18n/de';
import { formatTimerOption } from './TimerSetup';
import type { SharedConfig } from './shareConfig';

const TITLE_ID = 'geteiltes-spiel-titel';

export interface SharedConfigResult {
  /** Themen-ID aus dem Link, sofern sie im Index vorkommt. */
  topicId: string | null;
  teams: Team[];
  timerSeconds: number | null;
}

export interface SharedConfigDialogProps {
  open: boolean;
  config: SharedConfig;
  topics: TopicIndexEntry[];
  /** Namensvorschlag, wenn der Link keine Teams enthält. */
  fallbackTeams: Team[];
  onConfirm: (result: SharedConfigResult) => void;
  onDismiss: () => void;
}

/**
 * Wird beim Öffnen eines geteilten Links gezeigt. Thema und Bedenkzeit stehen
 * fest, die Teamnamen müssen vor dem Start bestätigt oder angepasst werden –
 * sonst spielt die nächste Runde versehentlich unter fremden Namen.
 */
export function SharedConfigDialog({
  open,
  config,
  topics,
  fallbackTeams,
  onConfirm,
  onDismiss,
}: SharedConfigDialogProps) {
  const [names, setNames] = useState<string[]>(() =>
    config.teamNames.length > 0 ? config.teamNames : fallbackTeams.map((team) => team.name),
  );

  const topic = topics.find((entry) => entry.id === config.topicId) ?? null;
  const timerLabel =
    config.timerSeconds === null ? de.setup.timerOff : formatTimerOption(config.timerSeconds);

  const rename = (index: number, name: string) => {
    setNames(names.map((current, position) => (position === index ? name : current)));
  };

  const confirm = () => {
    onConfirm({
      topicId: topic?.id ?? null,
      // createTeam kürzt zu lange und ersetzt leere Namen durch den Standard.
      teams: names.map((name, index) => createTeam(index, name)),
      timerSeconds: config.timerSeconds,
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
          {topic ? <Badge>{de.setup.sharedTopic(topic.title)}</Badge> : null}
          <Badge>{de.setup.sharedTimer(timerLabel)}</Badge>
        </div>

        {/* Unbekanntes Thema: der Rest des Links bleibt trotzdem nutzbar. */}
        {topic ? null : <p className="text-sm text-negative">{de.setup.sharedInvalid}</p>}

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
