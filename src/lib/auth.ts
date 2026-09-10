import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2';
import { getPool, ensureSetup } from './db';

export type User = { id: number; username: string; rank: number; is_staff: boolean };

const SECRET = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me';
export const SESSION_COOKIE = 'fuin_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
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

export async function getUserById(id: number): Promise<User | null> {
  await ensureSetup();
  const [rows] = await getPool().query<RowDataPacket[]>(
    'SELECT id, username, rank_level, is_staff FROM users WHERE id = ?',
    [id],
  );
  const r = rows[0];
  return r ? { id: r.id, username: r.username, rank: r.rank_level, is_staff: !!r.is_staff } : null;
}

export async function getUserByName(username: string): Promise<
  (User & { password_hash: string }) | null
> {
  await ensureSetup();
  const [rows] = await getPool().query<RowDataPacket[]>(
    'SELECT id, username, password_hash, rank_level, is_staff FROM users WHERE username = ?',
    [username],
  );
  const r = rows[0];
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
