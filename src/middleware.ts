import { defineMiddleware } from 'astro:middleware';
import { readSession, getUserById, SESSION_COOKIE } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  try {
    const id = readSession(context.cookies.get(SESSION_COOKIE)?.value);
    if (id) context.locals.user = await getUserById(id);
  } catch {
    // base indisponible ou session invalide → visiteur non authentifié
  }
  return next();
});
