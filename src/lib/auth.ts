import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';

export type User = { id: number; username: string; rank: number; is_staff: boolean };

const SECRET = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me';
export const SESSION_COOKIE = 'fuin_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, 10);
}
export function verifyPassword(pw: string, hash: string): boolean {
  return bcrypt.compareSync(pw, hash);
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function createSession(userId: number): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function readSession(token?: string): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  if (sign(`${uid}.${exp}`) !== sig) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  const id = Number(uid);
  return Number.isInteger(id) ? id : null;
}

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  rank_level: number;
  is_staff: number;
};

export function getUserById(id: number): User | null {
  const r = db
    .prepare('SELECT id, username, rank_level, is_staff FROM users WHERE id = ?')
    .get(id) as UserRow | undefined;
  return r ? { id: r.id, username: r.username, rank: r.rank_level, is_staff: !!r.is_staff } : null;
}

export function getUserByName(username: string): (User & { password_hash: string }) | null {
  const r = db
    .prepare('SELECT id, username, password_hash, rank_level, is_staff FROM users WHERE username = ?')
    .get(username) as UserRow | undefined;
  return r
    ? {
        id: r.id,
        username: r.username,
        password_hash: r.password_hash,
        rank: r.rank_level,
        is_staff: !!r.is_staff,
      }
    : null;
}
