import type { User } from './auth';
import { documents, groups, type Circle, type Document } from './content';

// Rang minimum requis pour voir chaque cercle.
// 1-5 = niveau de cercle du joueur ; 99 = réservé au staff.
export const circleMinRank: Record<Circle, number> = {
  general: 1,
  'premier-cercle': 1,
  'deuxieme-cercle': 2,
  'troisieme-cercle': 3,
  'quatrieme-cercle': 4,
  'cinquieme-cercle': 5,
  'sceaux-de-clan': 99,
  'a-valider': 99,
};

export function canView(circle: Circle, user: User | null): boolean {
  if (user?.is_staff) return true;
  if (!user) return false;
  return user.rank >= (circleMinRank[circle] ?? 99);
}

export function visibleDocuments(user: User | null): Document[] {
  return documents.filter((doc) => canView(doc.circle, user));
}

export function visibleGroups(user: User | null) {
  return groups.filter((group) => canView(group.key as Circle, user));
}
