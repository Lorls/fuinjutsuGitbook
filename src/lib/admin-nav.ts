// Navigation de la console d'administration.
// Ajoute simplement une entrée ici pour créer une nouvelle rubrique admin.
export type AdminNavItem = { key: string; href: string; glyph: string; label: string; hint?: string };

export const adminNav: AdminNavItem[] = [
  { key: 'dashboard', href: '/admin', glyph: '⌂', label: 'Tableau de bord', hint: "Vue d'ensemble" },
  { key: 'comptes', href: '/admin/comptes', glyph: '人', label: 'Comptes', hint: 'Joueurs & rangs' },
];
