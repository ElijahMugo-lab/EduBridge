import { ArrowLeftIcon, SealCheckIcon } from '@phosphor-icons/react/dist/ssr';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Avatar } from '@/features/edubridge/components/Bits';
import { Composer, RatingPrompt } from '@/features/edubridge/components/Interactive';
import { getSessionUser, getThreadForUser, listThreadsFor } from '@/features/edubridge/queries';
import { cn } from '@/utils/Helpers';
import { ThreadList } from '../ThreadList';

export const metadata = { title: 'Messages' };

export default async function ThreadPage(props: {
  params: Promise<{ locale: string; threadId: string }>;
}) {
  const { locale, threadId } = await props.params;
  setRequestLocale(locale);
  const session = await getSessionUser();
  if (!session) {
    redirect('/sign-in');
  }
  if (!session.profile) {
    redirect('/onboarding');
  }
  const id = Number.parseInt(threadId, 10);
  if (Number.isNaN(id)) {
    notFound();
  }
  const data = await getThreadForUser(id, session.clerkId);
  if (!data) {
    notFound();
  }
  const threads = await listThreadsFor(session.clerkId);
  const items = threads.map(t => ({
    id: t.thread.id,
    name: t.other ? `${t.other.firstName} ${t.other.lastName}` : 'Member',
    photo: t.other?.photo ?? null,
    role: t.other?.role ?? '',
    preview: t.lastMessage?.body ?? 'Say hello',
  }));
  const otherName = data.other ? `${data.other.firstName} ${data.other.lastName}` : 'Member';

  return (
    <div className="overflow-hidden rounded-2xl border bg-card md:grid md:min-h-[70vh] md:grid-cols-[320px_1fr]">
      {/* Contact list: hidden on phones (back link instead), left column on md+ (REQ-3.2) */}
      <div className="hidden md:block md:border-r">
        <p className="border-b px-4 py-3 text-sm font-bold">Inbox</p>
        <ThreadList items={items} activeId={id} />
      </div>

      <div className="flex min-h-[70vh] flex-col md:min-h-0">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Link href="/messages" className="md:hidden" aria-label="Back to inbox">
            <ArrowLeftIcon className="size-5" aria-hidden />
          </Link>
          <Avatar photo={data.other?.photo} name={otherName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{otherName}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">{data.other?.role}</p>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {data.messages.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Introduce yourself and describe what you are looking for.
            </p>
          )}
          {data.messages.map(message => (
            <div
              key={message.id}
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line sm:max-w-[65%]',
                message.senderUserId === session.clerkId
                  ? 'ml-auto rounded-br-md bg-secondary text-secondary-foreground'
                  : 'rounded-bl-md bg-muted',
              )}
            >
              {message.body}
            </div>
          ))}
        </div>

        {data.rating.received && (
          <p className="flex items-center gap-1.5 border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
            <SealCheckIcon weight="fill" className="size-4 text-clay" aria-hidden />
            {otherName}
            {' '}
            rated this collaboration
            {' '}
            {data.rating.received.stars}
            /5.
          </p>
        )}
        {data.rating.waitingOnOther && !data.rating.received && (
          <p className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
            Your rating is in. You will see theirs once they rate you back, or after 14 days.
          </p>
        )}
        {data.rating.eligible && <RatingPrompt threadId={id} otherName={otherName} />}
        <Composer threadId={id} />
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
