import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { hashPassword } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.user?.is_staff) return new Response('Interdit', { status: 403 });

  const form = await request.formData();
  const action = String(form.get('action') ?? '');
  const back = (msg: string) => redirect(`/admin/comptes?msg=${encodeURIComponent(msg)}`);

  try {
    if (action === 'create') {
      const username = String(form.get('username') ?? '').trim();
      const password = String(form.get('password') ?? '');
      const rank = clampRank(form.get('rank'));
      const staff = form.get('is_staff') ? 1 : 0;
      if (!username || password.length < 4) return back('Nom ou mot de passe invalide.');
      db.prepare(
        'INSERT INTO users (username, password_hash, rank_level, is_staff) VALUES (?, ?, ?, ?)',
      ).run(username, hashPassword(password), rank, staff);
      return back(`Compte « ${username} » créé.`);
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
      const password = String(form.get('password') ?? '');
      if (password.length < 4) return back('Mot de passe trop court.');
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), id);
      return back('Mot de passe réinitialisé.');
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
