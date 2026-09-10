import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL ?? 'file:./data/fuinjutsu.db';
  return url.startsWith('file:') ? url.slice('file:'.length) : url;
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath) || '.', { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rank_level INTEGER NOT NULL DEFAULT 1,
    is_staff INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Compte staff initial (créé une seule fois s'il n'existe pas).
const adminUser = process.env.ADMIN_USER;
const adminPass = process.env.ADMIN_PASSWORD;
if (adminUser && adminPass) {
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUser);
  if (!exists) {
    db.prepare(
      'INSERT INTO users (username, password_hash, rank_level, is_staff) VALUES (?, ?, 5, 1)',
    ).run(adminUser, bcrypt.hashSync(adminPass, 10));
  }
}
