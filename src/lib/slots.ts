import { db } from './db';
import { documents, groups } from './content';

export type Village = { id: number; name: string; sort_order: number };
export type CatalogueSeal = { slug: string; title: string; circle: string };
export type Occupant = { assignId: number; userId: number; username: string; note: string | null };
export type VillageSlot = { villageId: number; villageName: string; cap: number; occupants: Occupant[] };
export type SlottedSeal = {
  slug: string;
  title: string;
  circle: string;
  circleLabel: string;
  notes: string | null;
  villages: VillageSlot[];
};

const CIRCLE_ORDER = [
  'premier-cercle',
  'deuxieme-cercle',
  'troisieme-cercle',
  'quatrieme-cercle',
  'cinquieme-cercle',
  'sceaux-de-clan',
  'a-valider',
];

export function circleLabel(circle: string): string {
  return groups.find((g) => g.key === circle)?.label ?? circle;
}

/* ---------- Villages ---------- */
export function listVillages(): Village[] {
  return db.prepare('SELECT id, name, sort_order FROM village ORDER BY sort_order, name').all() as Village[];
}
export function addVillage(name: string): void {
  const next = (db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM village').get() as { n: number }).n;
  db.prepare('INSERT INTO village (name, sort_order) VALUES (?, ?)').run(name, next);
}
export function removeVillage(id: number): void {
  db.prepare('DELETE FROM seal_assignment WHERE village_id = ?').run(id);
  db.prepare('DELETE FROM seal_village_cap WHERE village_id = ?').run(id);
  db.prepare('DELETE FROM village WHERE id = ?').run(id);
}

/* ---------- Catalogue (depuis le contenu) ---------- */
export function catalogue(): CatalogueSeal[] {
  return documents
    .filter((d) => !d.isIndex && CIRCLE_ORDER.includes(d.circle))
    .map((d) => ({ slug: d.slug, title: d.title, circle: d.circle }))
    .sort((a, b) => CIRCLE_ORDER.indexOf(a.circle) - CIRCLE_ORDER.indexOf(b.circle) || a.title.localeCompare(b.title, 'fr'));
}
function catalogueTitle(slug: string): string {
  return catalogue().find((c) => c.slug === slug)?.title ?? slug;
}

/* ---------- Config (flag + caps) ---------- */
export function slottedSlugs(): Set<string> {
  return new Set((db.prepare('SELECT seal_slug FROM seal_config').all() as { seal_slug: string }[]).map((r) => r.seal_slug));
}
export function flagSeal(slug: string): void {
  db.prepare('INSERT OR IGNORE INTO seal_config (seal_slug, title) VALUES (?, ?)').run(slug, catalogueTitle(slug));
}
export function unflagSeal(slug: string): void {
  db.prepare('DELETE FROM seal_assignment WHERE seal_slug = ?').run(slug);
  db.prepare('DELETE FROM seal_village_cap WHERE seal_slug = ?').run(slug);
  db.prepare('DELETE FROM seal_config WHERE seal_slug = ?').run(slug);
}
export function setNotes(slug: string, notes: string): void {
  db.prepare("UPDATE seal_config SET notes = ?, updated_at = datetime('now') WHERE seal_slug = ?").run(notes || null, slug);
}
export function capFor(slug: string, villageId: number): number {
  const r = db.prepare('SELECT max_slots FROM seal_village_cap WHERE seal_slug = ? AND village_id = ?').get(slug, villageId) as
    | { max_slots: number }
    | undefined;
  return r?.max_slots ?? 0;
}
export function setCap(slug: string, villageId: number, max: number): void {
  if (max <= 0) {
    db.prepare('DELETE FROM seal_village_cap WHERE seal_slug = ? AND village_id = ?').run(slug, villageId);
    return;
  }
  db.prepare(
    'INSERT INTO seal_village_cap (seal_slug, village_id, max_slots) VALUES (?, ?, ?) ON CONFLICT(seal_slug, village_id) DO UPDATE SET max_slots = excluded.max_slots',
  ).run(slug, villageId, max);
}
export function setCapAll(slug: string, max: number): void {
  for (const v of listVillages()) setCap(slug, v.id, max);
}

/* ---------- Assignations ---------- */
export function occupiedFor(slug: string, villageId: number): number {
  return (db.prepare('SELECT COUNT(*) AS c FROM seal_assignment WHERE seal_slug = ? AND village_id = ?').get(slug, villageId) as { c: number }).c;
}
export function assign(
  slug: string,
  villageId: number,
  userId: number,
  note: string | null,
  by: number | null,
): { ok: boolean; reason?: string } {
  const cap = capFor(slug, villageId);
  if (cap <= 0) return { ok: false, reason: 'Aucune place dans ce village.' };
  if (occupiedFor(slug, villageId) >= cap) return { ok: false, reason: 'Complet.' };
  const dup = db.prepare('SELECT id FROM seal_assignment WHERE seal_slug = ? AND village_id = ? AND user_id = ?').get(slug, villageId, userId);
  if (dup) return { ok: false, reason: 'Ce joueur occupe déjà une place ici.' };
  db.prepare('INSERT INTO seal_assignment (seal_slug, village_id, user_id, note, assigned_by) VALUES (?, ?, ?, ?, ?)').run(
    slug,
    villageId,
    userId,
    note || null,
    by,
  );
  return { ok: true };
}
export function unassign(id: number): void {
  db.prepare('DELETE FROM seal_assignment WHERE id = ?').run(id);
}

/* ---------- Vue d'ensemble ---------- */
export function overview(): SlottedSeal[] {
  const villages = listVillages();
  const configs = db.prepare('SELECT seal_slug, title, notes FROM seal_config').all() as {
    seal_slug: string;
    title: string;
    notes: string | null;
  }[];
  const circleBySlug = new Map(catalogue().map((c) => [c.slug, c.circle]));

  const occStmt = db.prepare(
    'SELECT a.id AS assignId, a.user_id AS userId, u.username AS username, a.note AS note FROM seal_assignment a JOIN users u ON u.id = a.user_id WHERE a.seal_slug = ? AND a.village_id = ? ORDER BY u.username',
  );

  const result = configs.map((cfg) => {
    const villageSlots: VillageSlot[] = villages.map((v) => ({
      villageId: v.id,
      villageName: v.name,
      cap: capFor(cfg.seal_slug, v.id),
      occupants: occStmt.all(cfg.seal_slug, v.id) as Occupant[],
    }));
    const circle = circleBySlug.get(cfg.seal_slug) ?? 'a-valider';
    return { slug: cfg.seal_slug, title: cfg.title, circle, circleLabel: circleLabel(circle), notes: cfg.notes, villages: villageSlots };
  });

  result.sort(
    (a, b) => CIRCLE_ORDER.indexOf(a.circle) - CIRCLE_ORDER.indexOf(b.circle) || a.title.localeCompare(b.title, 'fr'),
  );
  return result;
}

export function totals() {
  let cap = 0;
  let occ = 0;
  let full = 0;
  for (const seal of overview()) {
    for (const v of seal.villages) {
      if (v.cap > 0) {
        cap += v.cap;
        occ += v.occupants.length;
        if (v.occupants.length >= v.cap) full++;
      }
    }
  }
  return { cap, occ, full };
}

export function allUsers(): { id: number; username: string; is_staff: number }[] {
  return db.prepare('SELECT id, username, is_staff FROM users ORDER BY username').all() as {
    id: number;
    username: string;
    is_staff: number;
  }[];
}
