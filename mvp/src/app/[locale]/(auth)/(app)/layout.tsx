import { UserButton } from '@clerk/nextjs';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { getSessionUser } from '@/features/edubridge/queries';
import { AppNav } from './Nav';

export default async function AppLayout(props: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const session = await getSessionUser();
  const role = session?.profile?.role ?? null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/dashboard" className="text-lg font-extrabold tracking-tight">
            Edu
            <em className="text-clay not-italic">Bridge</em>
          </Link>
          <div className="flex items-center gap-2">
            <AppNav role={role} isAdmin={session?.isAdmin ?? false} />
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-16">
        {props.children}
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
