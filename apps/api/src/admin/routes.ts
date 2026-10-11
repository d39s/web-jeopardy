import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  adminQuestionCreateSchema,
  adminQuestionDeleteSchema,
  adminQuestionUpdateSchema,
  adminReportResolveSchema,
  idSchema,
  sqlRunRequestSchema,
} from '@jeopardy/game-core';
import type { AdminIdentity } from '@jeopardy/game-core';
import type { AdminAuth } from './auth';
import { adminAccess } from './auth';
import type { AdminRepository, MutationResult } from './admin-repository';
import { SqlScriptError } from './sql-script';

declare module 'fastify' {
  interface FastifyRequest {
    adminIdentity: AdminIdentity | null;
  }
}

const questionQuerySchema = z.object({
  topicId: idSchema.optional(),
  rubricId: idSchema.optional(),
  q: z.string().trim().max(200).optional(),
  level: z.coerce.number().int().min(1).max(9).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
const logQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.coerce.number().int().positive().optional(),
});
const topicParams = z.object({ topicId: idSchema });
const questionParams = z.object({ topicId: idSchema, id: idSchema });
const logParams = z.object({ id: z.coerce.number().int().positive() });

function send(reply: FastifyReply, result: MutationResult, created = false) {
  switch (result.status) {
    case 'ok':
      return result.question
        ? reply.code(created ? 201 : 200).send(result.question)
        : reply.code(204).send();
    case 'missing':
      return reply.code(404).send({ error: 'Frage oder Rubrik nicht gefunden.' });
    case 'stale':
      return reply
        .code(409)
        .send({ error: 'Die Frage wurde inzwischen geändert. Bitte neu laden.' });
    case 'conflict':
      return reply.code(409).send({ error: result.message });
    case 'invalid':
      return reply.code(422).send({
        error: 'Die Änderung würde den Fragenpool unspielbar machen.',
        issues: result.issues,
      });
  }
}

export function registerAdmin(
  app: FastifyInstance,
  auth: Exclude<AdminAuth, { mode: 'off' }>,
  repository: AdminRepository,
) {
  app.register(
    async (admin) => {
      admin.decorateRequest('adminIdentity', null);
      admin.addHook('onRequest', async (request, reply) => {
        const access = adminAccess(auth, request.headers);
        if (access.status !== 'ok')
          return access.status === 'unauthenticated'
            ? reply.code(401).send({ error: 'Anmeldung erforderlich.' })
            : reply.code(403).send({ error: 'Keine Berechtigung für den Admin-Bereich.' });
        request.adminIdentity = access.identity;
      });
      // Zod-Fehler aus parse() als 400 statt als Dienstfehler melden.
      admin.setErrorHandler((error, _request, reply) => {
        if (error instanceof z.ZodError)
          return reply.code(400).send({
            error: 'Ungültige Anfrage.',
            issues: error.issues.map(
              (issue) => `${issue.path.join('.') || '(Wurzel)'}: ${issue.message}`,
            ),
          });
        if (error instanceof SqlScriptError)
          return reply
            .code(400)
            .send({ error: error.message, line: error.line, column: error.column });
        throw error;
      });
      const actor = (request: { adminIdentity: AdminIdentity | null }) =>
        request.adminIdentity!.user;

      admin.get('/me', async (request) => request.adminIdentity);
      admin.get('/topics', async () => repository.topics());
      admin.get('/questions', async (request) => {
        const { q, ...filter } = questionQuerySchema.parse(request.query);
        return repository.questions({ ...filter, ...(q ? { search: q } : {}) });
      });
      admin.post('/topics/:topicId/questions', async (request, reply) => {
        const { topicId } = topicParams.parse(request.params);
        const input = adminQuestionCreateSchema.parse(request.body);
        return send(reply, await repository.createQuestion(actor(request), topicId, input), true);
      });
      admin.put('/topics/:topicId/questions/:id', async (request, reply) => {
        const { topicId, id } = questionParams.parse(request.params);
        const input = adminQuestionUpdateSchema.parse(request.body);
        return send(reply, await repository.updateQuestion(actor(request), topicId, id, input));
      });
      // Version als Query statt Body: manche Proxys verwerfen DELETE-Bodies.
      admin.delete('/topics/:topicId/questions/:id', async (request, reply) => {
        const { topicId, id } = questionParams.parse(request.params);
        const { version } = adminQuestionDeleteSchema.parse(request.query);
        return send(reply, await repository.deleteQuestion(actor(request), topicId, id, version));
      });
      admin.get('/reports', async () => ({ questions: await repository.reports() }));
      admin.post('/reports/:topicId/:id/resolve', async (request, reply) => {
        const { topicId, id } = questionParams.parse(request.params);
        const { throughId } = adminReportResolveSchema.parse(request.body);
        return send(reply, await repository.resolveReports(actor(request), topicId, id, throughId));
      });
      admin.post('/sql/dry-run', async (request) =>
        repository.runSql(actor(request), sqlRunRequestSchema.parse(request.body), false),
      );
      admin.post('/sql/execute', async (request) =>
        repository.runSql(actor(request), sqlRunRequestSchema.parse(request.body), true),
      );
      admin.get('/log', async (request) => {
        const { limit, before } = logQuerySchema.parse(request.query);
        return { entries: await repository.log(limit, before) };
      });
      admin.get('/log/:id', async (request, reply) => {
        const { id } = logParams.parse(request.params);
        const entry = await repository.logEntry(id);
        return entry ?? reply.code(404).send({ error: 'Eintrag nicht gefunden.' });
      });
    },
    { prefix: '/api/v1/admin' },
  );
}
