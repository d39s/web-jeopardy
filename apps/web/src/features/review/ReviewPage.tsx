import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  DifficultyVerdict,
  DifficultyVote,
  ReviewQuestion,
  TopicCategory,
} from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { de } from '../../i18n/de';
import { randomQuestion, voteQuestion } from './api';
import { fetchTopicIndex } from '../../content/loader';

const PRIMARY_VERDICTS: DifficultyVerdict[] = ['too-easy', 'fits', 'too-hard'];

export function ReviewPage() {
  const [question, setQuestion] = useState<ReviewQuestion | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [topicId, setTopicId] = useState('');
  const [categoriesError, setCategoriesError] = useState(false);
  const pendingVote = useRef<DifficultyVote | null>(null);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(
    async (previous?: ReviewQuestion) => {
      controller.current?.abort();
      const request = new AbortController();
      controller.current = request;
      setLoading(true);
      setQuestion(null);
      setRevealed(false);
      setError(null);
      pendingVote.current = null;
      try {
        const next = await randomQuestion(previous, request.signal, topicId || undefined);
        if (!request.signal.aborted) setQuestion(next);
      } catch {
        if (!request.signal.aborted) setError(de.review.loadError);
      } finally {
        if (!request.signal.aborted) setLoading(false);
      }
    },
    [topicId],
  );

  useEffect(() => {
    const request = new AbortController();
    void fetchTopicIndex(request.signal).then((result) => {
      if (request.signal.aborted) return;
      if (result.ok) setCategories(result.data.categories);
      else setCategoriesError(true);
    });
    return () => request.abort();
  }, []);

  useEffect(() => {
    void load();
    return () => controller.current?.abort();
  }, [load]);

  async function vote(verdict: DifficultyVerdict) {
    if (!question || !revealed || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError(null);
    setFeedback('');
    // Bei unklarer Netzwerkantwort denselben Request erneut senden: keine Doppelzählung.
    if (!pendingVote.current || pendingVote.current.verdict !== verdict) {
      pendingVote.current = { requestId: crypto.randomUUID(), version: question.version, verdict };
    }
    try {
      const result = await voteQuestion(question, pendingVote.current);
      setFeedback(`${de.review.saved} ${de.review.score(result.score, result.votes)}`);
      await load(question);
    } catch {
      setError(de.review.saveError);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 p-6 sm:p-10">
      <header className="flex flex-col gap-3">
        <Link to="/" className="text-cat-1 underline underline-offset-4">
          {de.review.back}
        </Link>
        <h1 className="text-3xl font-bold sm:text-4xl">{de.review.heading}</h1>
        <p className="text-text-muted">{de.review.intro}</p>
      </header>
      <div className="flex flex-col gap-2">
        <label htmlFor="review-category" className="font-semibold">
          {de.review.category}
        </label>
        <select
          id="review-category"
          value={topicId}
          disabled={saving}
          className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-text sm:max-w-sm"
          onChange={(event) => {
            setFeedback('');
            setTopicId(event.target.value);
          }}
        >
          <option value="">{de.review.allCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
        {categoriesError ? (
          <p className="text-sm text-text-muted">{de.review.categoriesError}</p>
        ) : null}
      </div>
      <p role="status" className="min-h-6 text-sm text-text-muted">
        {saving ? de.review.saving : loading ? de.review.loading : feedback}
      </p>
      {error ? (
        <Card className="flex flex-col gap-3 border-negative/40 p-5">
          <p role="alert" className="text-negative">
            {error}
          </p>
          <Button disabled={saving} onClick={() => void load(question ?? undefined)}>
            {de.review.retry}
          </Button>
        </Card>
      ) : null}
      {question ? (
        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <section aria-label={de.review.verdictHeading} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-text-muted">{de.review.verdictHeading}</h3>
            <div className="grid grid-cols-3 gap-2">
              {PRIMARY_VERDICTS.map((verdict) =>
                !revealed && verdict !== 'fits' ? (
                  <div key={verdict} aria-hidden="true" />
                ) : (
                  <Button
                    key={verdict}
                    size="lg"
                    className="min-h-20 min-w-0 px-2 text-sm sm:text-lg"
                    variant={!revealed ? 'primary' : verdict === 'fits' ? 'success' : 'ghost'}
                    disabled={
                      saving ||
                      (pendingVote.current !== null && pendingVote.current.verdict !== verdict)
                    }
                    onClick={() => (revealed ? void vote(verdict) : setRevealed(true))}
                  >
                    {revealed ? de.review.verdicts[verdict] : de.review.reveal}
                  </Button>
                ),
              )}
            </div>
            <div className="flex min-h-11 items-center justify-center">
              {revealed ? (
                <Button
                  className="text-sm"
                  disabled={
                    saving ||
                    (pendingVote.current !== null && pendingVote.current.verdict !== 'unsure')
                  }
                  onClick={() => void vote('unsure')}
                >
                  {de.review.verdicts.unsure}
                </Button>
              ) : null}
            </div>
          </section>
          <p className="text-sm text-text-muted">
            {question.topicTitle} · {question.rubricName}
          </p>
          <h2 className="text-2xl font-semibold leading-relaxed">{question.question}</h2>
          {revealed ? (
            <>
              <section className="flex flex-col gap-3 border-t border-border pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                  {de.review.answer}
                </h3>
                <p className="text-2xl font-semibold text-positive">{question.answer}</p>
                {question.note ? <p className="text-text-muted">{question.note}</p> : null}
                <p className="text-lg font-bold">{de.review.difficulty(question.level)}</p>
                <p className="text-sm text-text-muted">
                  {de.review.score(question.score, question.votes)}
                </p>
              </section>
              <details className="text-sm text-text-muted">
                <summary className="cursor-pointer">{de.review.scoringDetails}</summary>
                <p className="mt-2">{de.review.hint}</p>
              </details>
            </>
          ) : null}
        </Card>
      ) : null}
    </main>
  );
}
