import type { QuestionReportRequest } from '@jeopardy/game-core';

const base = `${import.meta.env.BASE_URL}api/v1/questions/`;

export async function reportQuestion(
  topicId: string,
  questionId: string,
  report: QuestionReportRequest,
): Promise<void> {
  const response = await fetch(
    `${base}${encodeURIComponent(topicId)}/${encodeURIComponent(questionId)}/reports`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}
