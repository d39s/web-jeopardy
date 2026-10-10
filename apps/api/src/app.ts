import { timingSafeEqual } from 'node:crypto';
import Fastify from 'fastify';
import type { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import { difficultyVoteSchema, formatIssues, validateQuestionPool } from '@jeopardy/game-core';
import type { ContentRepository } from './repository';
import type { ReviewRepository } from './review-repository';

export function buildApp(
  repository: ContentRepository,
  options: {
    logger?: boolean;
    writeToken?: string;
    corsOrigins?: string[];
    reviews?: ReviewRepository;
  } = {},
) {
  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 10 * 1024 * 1024 });
  app.register(cors, { origin: options.corsOrigins ?? false });
  app.addHook('onSend', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Content-Type-Options', 'nosniff');
  });
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    request.log.error(error);
    const status = error.statusCode ?? 503;
    reply
      .code(status)
      .send({ error: status >= 500 ? 'Fragen-Dienst nicht verfügbar.' : error.message });
  });
  app.get('/api/v1/health', async () => {
    await repository.health();
    return { status: 'ok' };
  });
  app.get('/api/v1/topics/index.json', async () => repository.index());
  if (options.reviews) {
    const reviews = options.reviews;
    app.get<{ Querystring: { excludeTopic?: string; excludeId?: string; topicId?: string } }>(
      '/api/v1/review/random',
      async (request, reply) => {
        const { excludeTopic, excludeId, topicId } = request.query;
        if (
          ![excludeTopic, excludeId, topicId].every(
            (value) =>
              value === undefined ||
              (typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/i.test(value)),
          )
        ) {
          return reply.code(400).send({ error: 'Ungültige Themen- oder Fragen-ID.' });
        }
        const question = await reviews.random(excludeTopic, excludeId, topicId);
        if (!question) return reply.code(404).send({ error: 'Keine Fragen vorhanden.' });
        return question;
      },
    );
    app.post<{ Params: { topicId: string; id: string }; Body: unknown }>(
      '/api/v1/review/:topicId/:id/votes',
      async (request, reply) => {
        const { topicId, id } = request.params;
        if (![topicId, id].every((value) => /^[a-z0-9][a-z0-9-]{0,63}$/i.test(value))) {
          return reply.code(400).send({ error: 'Ungültige Fragen-ID.' });
        }
        const parsed = difficultyVoteSchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Bewertung.' });
        const result = await reviews.vote(topicId, id, parsed.data);
        if (result.status === 'missing')
          return reply.code(404).send({ error: 'Frage nicht gefunden.' });
        if (result.status !== 'ok')
          return reply
            .code(409)
            .send({ error: 'Frage oder Bewertung wurde geändert. Bitte neu laden.' });
        return result.rating;
      },
    );
  }
  app.get<{ Params: { id: string } }>('/api/v1/pools/:id.json', async (request, reply) => {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/i.test(request.params.id)) {
      return reply.code(400).send({ error: 'Ungültige Themen-ID.' });
    }
    const pool = await repository.pool(request.params.id);
    if (!pool) return reply.code(404).send({ error: 'Fragenpool nicht gefunden.' });
    return pool;
  });
  // Pool-Ersetzungen benötigen ein Token; lokale Schwierigkeitsbewertungen sind separat erlaubt.
  app.put<{ Params: { id: string }; Body: unknown }>(
    '/api/v1/pools/:id.json',
    async (request, reply) => {
      if (!options.writeToken)
        return reply.code(403).send({ error: 'Schreibzugriff ist deaktiviert.' });
      const expected = Buffer.from(`Bearer ${options.writeToken}`);
      const supplied = Buffer.from(request.headers.authorization ?? '');
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        return reply.code(401).send({ error: 'Authentifizierung erforderlich.' });
      }
      const result = validateQuestionPool(request.body);
      if (!result.ok)
        return reply
          .code(400)
          .send({ error: 'Ungültiger Fragenpool.', issues: formatIssues(result.issues) });
      if (result.data.id !== request.params.id)
        return reply.code(400).send({ error: 'Themen-ID stimmt nicht überein.' });
      await repository.save(result.data);
      return reply.code(204).send();
    },
  );
  return app;
}
