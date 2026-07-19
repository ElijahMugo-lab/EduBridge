import type { NextFetchEvent, NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './libs/I18nRouting';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
  '/agora(.*)',
  '/:locale/agora(.*)',
  '/messages(.*)',
  '/:locale/messages(.*)',
  '/admin(.*)',
  '/:locale/admin(.*)',
]);

const isAuthPage = createRouteMatcher([
  '/sign-in(.*)',
  '/:locale/sign-in(.*)',
  '/sign-up(.*)',
  '/:locale/sign-up(.*)',
]);

// Clerk-internal routes (keyless key sync, dev auto-proxy) must reach
// clerkMiddleware and skip i18n routing (which would 404 them).
const isClerkInternal = createRouteMatcher(['/clerk-sync-keyless(.*)', '/__clerk(.*)']);

export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  // Clerk keyless mode doesn't work with i18n, this is why we need to run the middleware conditionally
  if (isClerkInternal(request)) {
    return clerkMiddleware(async () => NextResponse.next())(request, event);
  }

  if (
    isAuthPage(request) || isProtectedRoute(request)
  ) {
    return clerkMiddleware(async (auth, req) => {
      // Check if the current route is protected and requires authentication
      // If user is not authenticated, redirect them to the sign-in page with proper locale
      if (isProtectedRoute(req)) {
        const locale = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';

        const signInUrl = new URL(`${locale}/sign-in`, req.url);

        await auth.protect({
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      // EduBridge has no organizations: users go straight to role onboarding,
      // which the dashboard page handles by redirecting profileless users.
      return handleI18nRouting(req);
    })(request, event);
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next`, `/_vercel` or `monitoring`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // plus Clerk's dev auto-proxy path, which may contain dots.
  matcher: ['/((?!_next|_vercel|monitoring|.*\\..*).*)', '/__clerk/:path*'],
};
