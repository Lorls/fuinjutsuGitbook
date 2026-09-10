import type { APIRoute } from 'astro';
import {
  getUserByName,
  verifyPassword,
  createSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const username = String(form.get('username') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const nextRaw = String(form.get('next') ?? '/');
  const next = nextRaw.startsWith('/') ? nextRaw : '/';

  const fail = () =>
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);

  if (!username || !password) return fail();

  let user;
  try {
    user = await getUserByName(username);
  } catch {
    return fail();
  }
  if (!user || !(await verifyPassword(password, user.password_hash))) return fail();

  cookies.set(SESSION_COOKIE, createSession(user.id), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return redirect(next);
};
