import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Avatar, EmptyState, Stars, VettedBadge } from '@/features/edubridge/components/Bits';
import { getSessionUser, listVettedEducators } from '@/features/edubridge/queries';
import { FilterBar } from './FilterBar';

export const metadata = {
  title: 'Find educators',
  description: 'Search vetted educators by subject, grade level and teaching philosophy.',
};

export default async function AgoraPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; subject?: string; grade?: string; philosophy?: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const session = await getSessionUser();
  if (!session) {
    redirect('/sign-in');
  }
  if (!session.profile) {
    redirect('/onboarding');
  }
  const filters = await props.searchParams;
  const educators = await listVettedEducators(filters);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Find your educator</h1>
      <p className="mt-1.5 max-w-[60ch] text-sm text-muted-foreground">
        Everyone listed here passed identity and Certificate of Good Conduct vetting.
      </p>

      <div className="mt-6">
        <FilterBar initial={filters} />
      </div>

      {educators.length === 0
        ? (
            <div className="mt-8">
              <EmptyState title="No educators match those filters">
                Try clearing a filter, or search a broader subject like Mathematics.
              </EmptyState>
            </div>
          )
        : (
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {educators.map(educator => (
                <li key={educator.userId}>
                  <Link
                    href={`/agora/${educator.userId}`}
                    className="flex h-full flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-ring"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar photo={educator.photo} name={`${educator.firstName} ${educator.lastName}`} />
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {educator.firstName}
                          {' '}
                          {educator.lastName}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {educator.subjects}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {educator.bio}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <VettedBadge compact />
                      {educator.rating
                        ? <Stars avg={educator.rating.avg} count={educator.rating.count} />
                        : <span className="text-xs text-muted-foreground">No ratings yet</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
