import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { MAX_REPORT_COMMENT_LENGTH } from '@jeopardy/game-core';
import type { QuestionReportSource } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';
import { reportQuestion } from './api';

const t = de.report;

export interface ReportQuestionProps {
  topicId: string;
  questionId: string;
  source: QuestionReportSource;
  /** Nach erfolgreicher Meldung, z. B. um die nächste Frage zu laden. */
  onReported?: () => void;
  className?: string;
}

/**
 * Knopf „Frage melden" mit Bestätigung und freiwilligem Kommentar. Eine
 * gemeldete Frage kommt bis zur Prüfung im Admin-Bereich in kein neues Spiel.
 */
export function ReportQuestion({
  topicId,
  questionId,
  source,
  onReported,
  className,
}: ReportQuestionProps) {
  const headingId = useId();
  const commentId = useId();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reported, setReported] = useState(false);
  // Bei unklarer Netzwerkantwort dieselbe Meldung erneut senden statt einer zweiten.
  const requestId = useRef<string | null>(null);

  const close = () => setOpen(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    requestId.current ??= crypto.randomUUID();
    setSending(true);
    setFailed(false);
    try {
      await reportQuestion(topicId, questionId, {
        requestId: requestId.current,
        source,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      setReported(true);
      setOpen(false);
      onReported?.();
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  if (reported) {
    return (
      <p role="status" className={cn('text-sm text-text-muted', className)}>
        {t.done}
      </p>
    );
  }

  return (
    <>
      <Button
        className={cn('px-3 py-1 text-sm text-text-muted', className)}
        onClick={() => setOpen(true)}
      >
        {t.button}
      </Button>
      <Modal open={open} onClose={close} labelledBy={headingId} className="w-[min(36rem,92vw)]">
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
          <h2 id={headingId} className="text-2xl font-bold">
            {t.heading}
          </h2>
          <p className="text-text-muted">{t.text}</p>
          <div className="flex flex-col gap-1">
            <label htmlFor={commentId} className="text-sm text-text-muted">
              {t.comment}
            </label>
            <textarea
              id={commentId}
              value={comment}
              maxLength={MAX_REPORT_COMMENT_LENGTH}
              placeholder={t.commentPlaceholder}
              disabled={sending}
              onChange={(event) => setComment(event.target.value)}
              className="min-h-24 rounded-btn border border-border bg-surface-hi px-3 py-2 text-text placeholder:text-text-muted focus-visible:outline-cat-1"
            />
          </div>
          {failed ? (
            <p role="alert" className="text-negative">
              {t.error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button disabled={sending} onClick={close}>
              {t.cancel}
            </Button>
            <Button type="submit" variant="danger" disabled={sending}>
              {sending ? t.sending : t.confirm}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
