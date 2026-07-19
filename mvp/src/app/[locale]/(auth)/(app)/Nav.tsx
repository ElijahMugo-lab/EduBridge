'use client';

import { ChatCircleDotsIcon, ShieldCheckIcon, UsersThreeIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/Helpers';

const linkClass = (active: boolean) => cn(
  'flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors',
  active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
);

export function AppNav(props: { role: string | null; isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center">
      {props.role === 'parent' && (
        <Link href="/agora" className={linkClass(pathname.includes('/agora'))}>
          <UsersThreeIcon className="size-4.5" aria-hidden />
          <span className="hidden sm:inline">Educators</span>
        </Link>
      )}
      {props.role && (
        <Link href="/messages" className={linkClass(pathname.includes('/messages'))}>
          <ChatCircleDotsIcon className="size-4.5" aria-hidden />
          <span className="hidden sm:inline">Messages</span>
        </Link>
      )}
      {props.isAdmin && (
        <Link href="/admin" className={linkClass(pathname.includes('/admin'))}>
          <ShieldCheckIcon className="size-4.5" aria-hidden />
          <span className="hidden sm:inline">Review</span>
        </Link>
      )}
    </nav>
  );
}
