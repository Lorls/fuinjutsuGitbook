type GuardContext = {
  locals: App.Locals;
  url: URL;
  redirect: (path: string) => Response;
};

// À appeler en tête d'une page admin :
//   const denied = requireStaff(Astro); if (denied) return denied;
export function requireStaff(ctx: GuardContext): Response | null {
  const user = ctx.locals.user;
  if (!user) return ctx.redirect('/login?next=' + encodeURIComponent(ctx.url.pathname));
  if (!user.is_staff) return new Response('Accès réservé au staff.', { status: 403 });
  return null;
}
