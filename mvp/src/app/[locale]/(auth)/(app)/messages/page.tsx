import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/features/edubridge/components/Bits';
import { getSessionUser, listThreadsFor } from '@/features/edubridge/queries';
import { ThreadList } from './ThreadList';

export const metadata = { title: 'Messages' };

export default async function MessagesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const session = await getSessionUser();
  if (!session) {
    redirect('/sign-in');
  }
  if (!session.profile) {
    redirect('/onboarding');
  }
  const threads = await listThreadsFor(session.clerkId);

  if (threads.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Messages</h1>
        <EmptyState title="No conversations yet">
          {session.profile.role === 'parent'
            ? (
                <>
                  Find an educator in
                  {' '}
                  <Link href="/agora" className="font-semibold text-clay underline">the directory</Link>
                  {' '}
                  and send the first message.
                </>
              )
            : 'When a parent messages you, the conversation appears here.'}
        </EmptyState>
      </div>
    );
  }

  const items = threads.map(t => ({
    id: t.thread.id,
    name: t.other ? `${t.other.firstName} ${t.other.lastName}` : 'Member',
    photo: t.other?.photo ?? null,
    role: t.other?.role ?? '',
    preview: t.lastMessage?.body ?? 'Say hello',
  }));

  return (
    <div className="overflow-hidden rounded-2xl border bg-card md:grid md:min-h-[60vh] md:grid-cols-[320px_1fr]">
      <div className="md:border-r">
        <p className="border-b px-4 py-3 text-sm font-bold">Inbox</p>
        <ThreadList items={items} />
      </div>
      <div className="hidden place-items-center p-10 text-sm text-muted-foreground md:grid">
        Select a conversation
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
