import { difficultyRatingSchema, reviewQuestionSchema } from '@jeopardy/game-core';
import type { DifficultyVote, ReviewQuestion } from '@jeopardy/game-core';

const base = `${import.meta.env.BASE_URL}api/v1/review/`;

export async function randomQuestion(
  previous?: ReviewQuestion,
  signal?: AbortSignal,
  topicId?: string,
): Promise<ReviewQuestion> {
  const params = new URLSearchParams();
  if (previous) {
    params.set('excludeTopic', previous.topicId);
    params.set('excludeId', previous.id);
  }
  if (topicId) params.set('topicId', topicId);
  const query = params.size ? `?${params}` : '';
  const response = await fetch(`${base}random${query}`, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return reviewQuestionSchema.parse(await response.json());
}

export async function voteQuestion(question: ReviewQuestion, vote: DifficultyVote) {
  const response = await fetch(
    `${base}${encodeURIComponent(question.topicId)}/${encodeURIComponent(question.id)}/votes`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vote),
    },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return difficultyRatingSchema.parse(await response.json());
}
