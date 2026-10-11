import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { CLUE_LEVELS } from '@jeopardy/game-core';
import type { AdminQuestion, AdminTopic } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { de } from '../../i18n/de';
import { adminApi } from './api';
import type { AdminApiError } from './api';
import { errorMessage, ErrorNotice, SelectField, TextAreaField } from './fields';

const t = de.admin.question;

export interface QuestionDialogProps {
  topic: AdminTopic;
  /** Ohne Frage legt der Dialog eine neue an. */
  question?: AdminQuestion;
  defaultRubricId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function QuestionDialog({
  topic,
  question,
  defaultRubricId,
  onClose,
  onSaved,
}: QuestionDialogProps) {
  const headingId = useId();
  const [id, setId] = useState('');
  const [rubricId, setRubricId] = useState(
    question?.rubricId ?? defaultRubricId ?? topic.rubrics[0]?.id ?? '',
  );
  const [level, setLevel] = useState(question?.sourceLevel ?? 3);
  const [text, setText] = useState(question?.question ?? '');
  const [answer, setAnswer] = useState(question?.answer ?? '');
  const [note, setNote] = useState(question?.note ?? '');
  const [resetRating, setResetRating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AdminApiError | null>(null);

  async function run(operation: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await operation();
      onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const fields = { rubricId, level, question: text, answer };
    void run(() =>
      question
        ? adminApi.updateQuestion(question, { ...fields, note, resetRating })
        : adminApi.createQuestion(topic.id, {
            ...fields,
            ...(id.trim() ? { id: id.trim() } : {}),
            ...(note.trim() ? { note } : {}),
          }),
    );
  }

  const votes = question
    ? question.votes.fits + question.votes.tooHard + question.votes.tooEasy + question.votes.unsure
    : 0;

  return (
    <Modal open onClose={onClose} labelledBy={headingId} className="w-[min(48rem,94vw)]">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id={headingId} className="text-2xl font-bold">
            {question ? t.editHeading : t.createHeading}
          </h2>
          <p className="text-sm text-text-muted">
            {topic.title}
            {question ? ` · ${question.id}` : null}
          </p>
        </div>
        {question ? null : (
          <TextField
            label={t.id}
            hint={t.idHint}
            value={id}
            maxLength={64}
            pattern="[a-z0-9][a-z0-9-]*"
            onChange={(event) => setId(event.target.value)}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={t.rubric}
            value={rubricId}
            required
            onChange={(event) => setRubricId(event.target.value)}
          >
            {topic.rubrics.map((rubric) => (
              <option key={rubric.id} value={rubric.id}>
                {rubric.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t.level}
            value={level}
            onChange={(event) => setLevel(Number(event.target.value))}
          >
            {CLUE_LEVELS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectField>
        </div>
        <TextAreaField
          label={t.question}
          value={text}
          required
          maxLength={500}
          rows={3}
          onChange={(event) => setText(event.target.value)}
        />
        <TextAreaField
          label={t.answer}
          value={answer}
          required
          maxLength={500}
          rows={2}
          onChange={(event) => setAnswer(event.target.value)}
        />
        <TextAreaField
          label={t.note}
          hint={t.noteHint}
          value={note}
          maxLength={500}
          rows={2}
          onChange={(event) => setNote(event.target.value)}
        />
        {question ? (
          <div className="flex flex-col gap-2 rounded-btn border border-border p-3 text-sm">
            <p>
              {t.rating(question.score, votes)}
              <span className="text-text-muted">
                {' · '}
                {t.votes(question.votes.fits, question.votes.tooHard, question.votes.tooEasy)}
              </span>
            </p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={resetRating || level !== question.sourceLevel}
                disabled={level !== question.sourceLevel}
                onChange={(event) => setResetRating(event.target.checked)}
              />
              {t.resetRating}
            </label>
            <p className="text-xs text-text-muted">{t.resetHint}</p>
          </div>
        ) : null}
        {error ? <ErrorNotice error={error} /> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? t.saving : t.save}
          </Button>
          <Button onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          {question ? (
            <div className="ml-auto flex flex-col items-end gap-1">
              <Button
                variant="danger"
                disabled={busy}
                onClick={() =>
                  confirmDelete
                    ? void run(() => adminApi.deleteQuestion(question))
                    : setConfirmDelete(true)
                }
              >
                {confirmDelete ? t.confirmDelete : t.delete}
              </Button>
              {confirmDelete ? <p className="text-xs text-text-muted">{t.deleteHint}</p> : null}
            </div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
