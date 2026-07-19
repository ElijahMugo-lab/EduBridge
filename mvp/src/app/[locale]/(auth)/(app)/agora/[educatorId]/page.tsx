import { ArrowLeftIcon, ChalkboardTeacherIcon, GraduationCapIcon, MapPinIcon } from '@phosphor-icons/react/dist/ssr';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Avatar, Stars, VettedBadge } from '@/features/edubridge/components/Bits';
import { MessageEducatorButton } from '@/features/edubridge/components/Interactive';
import { getEducator, getSessionUser } from '@/features/edubridge/queries';

// REQ-2.3: full educator view with philosophy, hourly rate and the primary CTA.
export default async function EducatorPage(props: {
  params: Promise<{ locale: string; educatorId: string }>;
}) {
  const { locale, educatorId } = await props.params;
  setRequestLocale(locale);
  const session = await getSessionUser();
  if (!session) {
    redirect('/sign-in');
  }
  if (!session.profile) {
    redirect('/onboarding');
  }
  const educator = await getEducator(decodeURIComponent(educatorId));
  if (!educator) {
    notFound();
  }
  const isParent = session.profile.role === 'parent';
  const isDemoEducator = educator.userId.startsWith('seed-');

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/agora" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" aria-hidden />
        All educators
      </Link>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar photo={educator.photo} name={`${educator.firstName} ${educator.lastName}`} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {educator.firstName}
              {' '}
              {educator.lastName}
            </h1>
            <VettedBadge />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ChalkboardTeacherIcon className="size-4" aria-hidden />
              {educator.subjects}
            </span>
            <span className="inline-flex items-center gap-1">
              <GraduationCapIcon className="size-4" aria-hidden />
              {educator.gradeLevels}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-4" aria-hidden />
              {educator.county}
            </span>
          </div>
          <div className="mt-2">
            {educator.rating
              ? <Stars avg={educator.rating.avg} count={educator.rating.count} />
              : <span className="text-sm text-muted-foreground">No ratings yet</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="font-mono text-[0.62rem] tracking-wide text-muted-foreground uppercase">Hourly rate</p>
          <p className="mt-1 text-xl font-extrabold">
            KSh
            {' '}
            {educator.hourlyRateKsh?.toLocaleString() ?? '-'}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="font-mono text-[0.62rem] tracking-wide text-muted-foreground uppercase">Philosophy</p>
          <p className="mt-1 text-xl font-extrabold">{educator.philosophy}</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold">About</h2>
      <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">
        {educator.bio}
      </p>

      <div className="mt-8">
        <MessageEducatorButton
          educatorUserId={educator.userId}
          disabled={!isParent || isDemoEducator}
          disabledReason={!isParent
            ? 'Only parent accounts can message educators.'
            : isDemoEducator
              ? 'This is a demo profile seeded for preview. Real educators appear here after vetting.'
              : undefined}
        />
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
