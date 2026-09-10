import type { APIRoute } from 'astro';
import {
  addVillage,
  removeVillage,
  listVillages,
  flagSeal,
  unflagSeal,
  setNotes,
  setCap,
  setCapAll,
  assign,
  unassign,
} from '../../../lib/slots';

const num = (v: FormDataEntryValue | null) => Number(v);

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.user?.is_staff) return new Response('Interdit', { status: 403 });

  const form = await request.formData();
  const action = String(form.get('action') ?? '');

  const toConfig = (msg: string) => redirect(`/admin/slots/config?msg=${encodeURIComponent(msg)}`);
  const toSlots = (msg: string) => redirect(`/admin/slots?msg=${encodeURIComponent(msg)}`);

  try {
    // --- Villages ---
    if (action === 'village_add') {
      const name = String(form.get('name') ?? '').trim();
      if (!name) return toConfig('Nom de village vide.');
      addVillage(name);
      return toConfig(`Village « ${name} » ajouté.`);
    }
    if (action === 'village_remove') {
      removeVillage(num(form.get('id')));
      return toConfig('Village supprimé (ses caps et assignations aussi).');
    }

    // --- Config des sceaux slottés ---
    if (action === 'flag') {
      const slug = String(form.get('seal_slug') ?? '');
      if (!slug) return toConfig('Sceau invalide.');
      flagSeal(slug);
      return toConfig('Sceau ajouté au système de slots.');
    }
    if (action === 'unflag') {
      unflagSeal(String(form.get('seal_slug') ?? ''));
      return toConfig('Sceau retiré du système (assignations effacées).');
    }
    if (action === 'notes') {
      setNotes(String(form.get('seal_slug') ?? ''), String(form.get('notes') ?? ''));
      return toConfig('Note enregistrée.');
    }
    if (action === 'caps') {
      const slug = String(form.get('seal_slug') ?? '');
      for (const v of listVillages()) {
        const raw = form.get(`cap_${v.id}`);
        if (raw !== null) setCap(slug, v.id, Math.max(0, Math.round(num(raw) || 0)));
      }
      return toConfig('Places mises à jour.');
    }
    if (action === 'capall') {
      setCapAll(String(form.get('seal_slug') ?? ''), Math.max(0, Math.round(num(form.get('value')) || 0)));
      return toConfig('Places appliquées à tous les villages.');
    }

    // --- Assignations ---
    if (action === 'assign') {
      const res = assign(
        String(form.get('seal_slug') ?? ''),
        num(form.get('village_id')),
        num(form.get('user_id')),
        String(form.get('note') ?? '') || null,
        locals.user.id,
      );
      return toSlots(res.ok ? 'Joueur assigné.' : `Impossible : ${res.reason}`);
    }
    if (action === 'unassign') {
      unassign(num(form.get('id')));
      return toSlots('Assignation retirée.');
    }
  } catch (err) {
    const dup = String(err).includes('UNIQUE');
    return toConfig(dup ? 'Ce nom existe déjà.' : 'Erreur lors de l’opération.');
  }

  return toSlots('Action inconnue.');
};
