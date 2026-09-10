import type { APIRoute } from 'astro';
import { getPool, ensureSetup } from '../../../lib/db';
import { hashPassword } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.user?.is_staff) return new Response('Interdit', { status: 403 });

  const form = await request.formData();
  const action = String(form.get('action') ?? '');
  await ensureSetup();
  const db = getPool();

  const back = (msg: string) => redirect(`/admin?msg=${encodeURIComponent(msg)}`);

  try {
    if (action === 'create') {
      const username = String(form.get('username') ?? '').trim();
      const password = String(form.get('password') ?? '');
      const rank = clampRank(form.get('rank'));
      const staff = form.get('is_staff') ? 1 : 0;
      if (!username || password.length < 4) return back('Nom ou mot de passe invalide.');
      await db.query(
        'INSERT INTO users (username, password_hash, rank_level, is_staff) VALUES (?, ?, ?, ?)',
        [username, await hashPassword(password), rank, staff],
      );
      return back(`Compte « ${username} » créé.`);
    }

    if (action === 'update') {
      const id = Number(form.get('id'));
      const rank = clampRank(form.get('rank'));
      const staff = form.get('is_staff') ? 1 : 0;
      await db.query('UPDATE users SET rank_level = ?, is_staff = ? WHERE id = ?', [rank, staff, id]);
      return back('Rang mis à jour.');
    }

    if (action === 'password') {
      const id = Number(form.get('id'));
      const password = String(form.get('password') ?? '');
      if (password.length < 4) return back('Mot de passe trop court.');
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [
        await hashPassword(password),
        id,
      ]);
      return back('Mot de passe réinitialisé.');
    }

    if (action === 'delete') {
      const id = Number(form.get('id'));
      if (id === locals.user.id) return back('Impossible de supprimer son propre compte.');
      await db.query('DELETE FROM users WHERE id = ?', [id]);
      return back('Compte supprimé.');
    }
  } catch (err) {
    const dup = String(err).includes('ER_DUP_ENTRY');
    return back(dup ? 'Ce nom est déjà pris.' : 'Erreur lors de l’opération.');
  }

  return back('Action inconnue.');
};

function clampRank(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}
