import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'fuinjutsu',
      waitForConnections: true,
      connectionLimit: 5,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

let ready: Promise<void> | null = null;

// Crée la table et le compte staff initial (une seule fois par process).
export function ensureSetup(): Promise<void> {
  if (!ready) ready = setup();
  return ready;
}

async function setup(): Promise<void> {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      rank_level INT NOT NULL DEFAULT 1,
      is_staff TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4
  `);

  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (adminUser && adminPass) {
    const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [adminUser]);
    if ((rows as unknown[]).length === 0) {
      const hash = await bcrypt.hash(adminPass, 10);
      await db.query(
        'INSERT INTO users (username, password_hash, rank_level, is_staff) VALUES (?, ?, 5, 1)',
        [adminUser, hash],
      );
    }
  }
}
