import { ClockIcon, SealCheckIcon, XCircleIcon } from '@phosphor-icons/react/dist/ssr';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Avatar, VettedBadge } from '@/features/edubridge/components/Bits';
import { getSessionUser } from '@/features/edubridge/queries';
import { cn } from '@/utils/Helpers';

export const metadata = { title: 'EduBridge' };

export default async function DashboardPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const session = await getSessionUser();
  if (!session) {
    redirect('/sign-in');
  }
  if (!session.profile) {
    redirect('/onboarding');
  }
  const profile = session.profile;
  if (profile.role === 'parent') {
    redirect('/agora');
  }

  // Educator home: vetting status and quick links.
  const status = profile.status;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <Avatar photo={profile.photo} name={`${profile.firstName} ${profile.lastName}`} size="lg" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {profile.firstName}
            {' '}
            {profile.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile.subjects}
            {' '}
            in
            {' '}
            {profile.county}
          </p>
          {status === 'verified' && <div className="mt-1.5"><VettedBadge /></div>}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-6">
        {status === 'pending' && (
          <>
            <p className="flex items-center gap-2 font-semibold">
              <ClockIcon className="size-5 text-clay" aria-hidden />
              Your profile is being reviewed
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Our team checks your TSC number against the register and verifies your Certificate of Good Conduct.
              Until the review is approved, your profile stays hidden from parents. Most reviews finish within 2 business days.
            </p>
          </>
        )}
        {status === 'verified' && (
          <>
            <p className="flex items-center gap-2 font-semibold">
              <SealCheckIcon weight="fill" className="size-5 text-clay" aria-hidden />
              You are live in the educator directory
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Parents can now find you and start a conversation. Replies within 48 hours keep your response rate healthy.
            </p>
            <div className="mt-4">
              <Link href="/messages" className={cn(buttonVariants(), 'rounded-full font-semibold')}>
                Open messages
              </Link>
            </div>
          </>
        )}
        {status === 'rejected' && (
          <>
            <p className="flex items-center gap-2 font-semibold">
              <XCircleIcon className="size-5 text-destructive" aria-hidden />
              Your vetting was not approved
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This usually means a document was unreadable or a detail did not match the official registers.
              Contact support@edubridge.co.ke and we will walk you through resubmitting.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
