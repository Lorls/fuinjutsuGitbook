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

// ---- Système de slots de sceaux ----
db.exec(`
  CREATE TABLE IF NOT EXISTS village (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS seal_config (
    seal_slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    notes TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS seal_village_cap (
    seal_slug TEXT NOT NULL,
    village_id INTEGER NOT NULL,
    max_slots INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (seal_slug, village_id)
  );
  CREATE TABLE IF NOT EXISTS seal_assignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seal_slug TEXT NOT NULL,
    village_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    note TEXT,
    assigned_by INTEGER,
    assigned_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_assign_seal ON seal_assignment(seal_slug, village_id);
`);

// Villages initiaux (créés une seule fois ; gérables ensuite depuis l'admin)
if ((db.prepare('SELECT COUNT(*) AS c FROM village').get() as { c: number }).c === 0) {
  const insV = db.prepare('INSERT INTO village (name, sort_order) VALUES (?, ?)');
  ['Ame', 'Konoha', 'Suna'].forEach((n, i) => insV.run(n, i));
}
