import type { IncomingHttpHeaders } from 'node:http';
import type { AdminIdentity } from '@jeopardy/game-core';

/**
 * Anmeldung übernimmt ein vorgelagerter Proxy (Authentik Forward Auth am Ingress). Die API
 * vertraut dessen Headern nur, wenn das ausdrücklich eingeschaltet ist; ohne Einstellung
 * ist der Admin-Bereich gar nicht registriert.
 */
export type AdminAuth =
  { mode: 'off' } | { mode: 'dev'; user: string } | { mode: 'forward-auth'; groups: string[] };

export const USER_HEADER = 'x-authentik-username';
export const GROUPS_HEADER = 'x-authentik-groups';

export function adminAuthFromEnv(env: NodeJS.ProcessEnv): AdminAuth {
  const mode = env.ADMIN_AUTH?.trim() || 'off';
  if (mode === 'off') return { mode };
  if (mode === 'dev') return { mode, user: env.ADMIN_DEV_USER?.trim() || 'dev' };
  if (mode === 'forward-auth') {
    const groups = (env.ADMIN_GROUPS ?? '')
      .split(',')
      .map((group) => group.trim())
      .filter(Boolean);
    return { mode, groups };
  }
  throw new Error('ADMIN_AUTH erwartet off, forward-auth oder dev.');
}

function header(headers: IncomingHttpHeaders, name: string): string {
  const value = headers[name];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export type AdminAccess =
  { status: 'ok'; identity: AdminIdentity } | { status: 'unauthenticated' | 'forbidden' };

export function adminAccess(
  auth: Exclude<AdminAuth, { mode: 'off' }>,
  headers: IncomingHttpHeaders,
): AdminAccess {
  if (auth.mode === 'dev') return { status: 'ok', identity: { user: auth.user, groups: [] } };
  const user = header(headers, USER_HEADER);
  if (!user) return { status: 'unauthenticated' };
  // Authentik trennt Gruppen mit senkrechtem Strich.
  const groups = header(headers, GROUPS_HEADER)
    .split('|')
    .map((group) => group.trim())
    .filter(Boolean);
  if (auth.groups.length > 0 && !auth.groups.some((group) => groups.includes(group))) {
    return { status: 'forbidden' };
  }
  return { status: 'ok', identity: { user: user.slice(0, 200), groups } };
}
