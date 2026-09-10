import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { db } from '../../../lib/db';
import { hashPassword } from '../../../lib/auth';

// Alphabet sans caractères ambigus (pas de O/0/I/l).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
function generatePassword(len = 12): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.user?.is_staff) return new Response('Interdit', { status: 403 });

  const form = await request.formData();
  const action = String(form.get('action') ?? '');

  const back = (msg: string, extra?: { pw?: string; user?: string }) => {
    const params = new URLSearchParams({ msg });
    if (extra?.pw) params.set('pw', extra.pw);
    if (extra?.user) params.set('user', extra.user);
    return redirect(`/admin/comptes?${params.toString()}`);
  };

  try {
    if (action === 'create') {
      const username = String(form.get('username') ?? '').trim();
      const rank = clampRank(form.get('rank'));
      const staff = form.get('is_staff') ? 1 : 0;
      if (!username) return back('Nom invalide.');
      const password = generatePassword();
      db.prepare(
        'INSERT INTO users (username, password_hash, rank_level, is_staff) VALUES (?, ?, ?, ?)',
      ).run(username, hashPassword(password), rank, staff);
      return back(`Compte « ${username} » créé.`, { pw: password, user: username });
    }

    if (action === 'update') {
      const id = Number(form.get('id'));
      db.prepare('UPDATE users SET rank_level = ?, is_staff = ? WHERE id = ?').run(
        clampRank(form.get('rank')),
        form.get('is_staff') ? 1 : 0,
        id,
      );
      return back('Rang mis à jour.');
    }

    if (action === 'password') {
      const id = Number(form.get('id'));
      const row = db.prepare('SELECT username FROM users WHERE id = ?').get(id) as
        | { username: string }
        | undefined;
      if (!row) return back('Compte introuvable.');
      const password = generatePassword();
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), id);
      return back(`Nouveau mot de passe pour « ${row.username} ».`, {
        pw: password,
        user: row.username,
      });
    }

    if (action === 'delete') {
      const id = Number(form.get('id'));
      if (id === locals.user.id) return back('Impossible de supprimer son propre compte.');
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return back('Compte supprimé.');
    }
  } catch (err) {
    const dup = String(err).includes('UNIQUE');
    return back(dup ? 'Ce nom est déjà pris.' : 'Erreur lors de l’opération.');
  }

  return back('Action inconnue.');
};

function clampRank(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}
