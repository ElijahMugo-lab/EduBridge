import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Avatar, EmptyState } from '@/features/edubridge/components/Bits';
import { ReviewButtons } from '@/features/edubridge/components/Interactive';
import { getSessionUser, listLowRatedUsers, listPendingEducators } from '@/features/edubridge/queries';

export const metadata = { title: 'Vetting review' };

const TSC_PORTAL = 'https://tsconline.tsc.go.ke/register/registration-status';
const DCI_PORTAL = 'https://dci.ecitizen.go.ke/verify';

export default async function AdminPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const session = await getSessionUser();
  if (!session) {
    redirect('/sign-in');
  }
  if (!session.isAdmin) {
    redirect('/dashboard');
  }
  const pending = await listPendingEducators();
  const flagged = await listLowRatedUsers();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Vetting review</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Check each educator against the
        {' '}
        <a href={TSC_PORTAL} target="_blank" rel="noopener" className="font-semibold text-clay underline">TSC register</a>
        {' '}
        and the
        {' '}
        <a href={DCI_PORTAL} target="_blank" rel="noopener" className="font-semibold text-clay underline">DCI eCitizen portal</a>
        , then approve or reject.
      </p>

      {pending.length === 0
        ? (
            <div className="mt-8">
              <EmptyState title="No educators waiting for review" />
            </div>
          )
        : (
            <ul className="mt-8 space-y-4">
              {pending.map(({ profile, docs }) => (
                <li key={profile.userId} className="rounded-2xl border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar photo={profile.photo} name={`${profile.firstName} ${profile.lastName}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {profile.firstName}
                        {' '}
                        {profile.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.subjects}
                        {' '}
                        in
                        {' '}
                        {profile.county}
                        {' '}
                        for KSh
                        {' '}
                        {profile.hourlyRateKsh?.toLocaleString()}
                        /hr
                      </p>
                    </div>
                    <span className="font-mono text-xs text-clay">
                      TSC
                      {' '}
                      {profile.tscNumber}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
                  {profile.consentAt && (
                    <p className="mt-2 font-mono text-[0.62rem] tracking-wide text-muted-foreground uppercase">
                      Consented to document processing on
                      {' '}
                      {profile.consentAt.toISOString().slice(0, 10)}
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {docs.map(doc => (
                      <figure key={doc.id} className="rounded-xl border p-3">
                        <figcaption className="mb-2 font-mono text-[0.62rem] tracking-wide text-muted-foreground uppercase">
                          {doc.kind === 'national_id' ? 'National ID' : 'Certificate of Good Conduct'}
                          {' '}
                          <span className="text-clay">
                            {Math.round(doc.sizeKb)}
                            {' '}
                            KB
                          </span>
                        </figcaption>
                        {doc.mime.startsWith('image/')
                          ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={doc.dataUrl} alt={`${doc.kind} document`} className="max-h-56 w-full rounded-lg object-contain" />
                            )
                          : (
                              <a href={doc.dataUrl} download={doc.fileName} className="text-sm font-semibold text-clay underline">
                                Download PDF (
                                {doc.fileName}
                                )
                              </a>
                            )}
                      </figure>
                    ))}
                  </div>
                  <div className="mt-4">
                    <ReviewButtons educatorUserId={profile.userId} />
                  </div>
                </li>
              ))}
            </ul>
          )}

      <h2 className="mt-12 flex items-center gap-2 text-lg font-bold">
        <WarningCircleIcon className="size-5 text-destructive" aria-hidden />
        Quality alerts
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Members whose revealed rating average has dropped below 3.5 stars.
      </p>
      {flagged.length === 0
        ? <p className="mt-4 text-sm text-muted-foreground">None right now.</p>
        : (
            <ul className="mt-4 space-y-2">
              {flagged.map(f => (
                <li key={f.profile?.userId ?? 'unknown'} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                  <span className="font-semibold">
                    {f.profile ? `${f.profile.firstName} ${f.profile.lastName}` : 'Unknown member'}
                  </span>
                  <span className="font-mono text-sm text-destructive">
                    {f.avg.toFixed(1)}
                    {' '}
                    avg over
                    {' '}
                    {f.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
