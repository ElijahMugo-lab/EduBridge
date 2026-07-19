import Link from 'next/link';
import { Avatar } from '@/features/edubridge/components/Bits';
import { cn } from '@/utils/Helpers';

export type ThreadListItem = {
  id: number;
  name: string;
  photo: string | null;
  role: string;
  preview: string;
};

// Contact list column (REQ-3.2). Server component: plain links, no client state.
export function ThreadList(props: { items: ThreadListItem[]; activeId?: number }) {
  return (
    <nav aria-label="Conversations" className="divide-y">
      {props.items.map(item => (
        <Link
          key={item.id}
          href={`/messages/${item.id}`}
          aria-current={item.id === props.activeId ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60',
            item.id === props.activeId && 'bg-muted',
          )}
        >
          <Avatar photo={item.photo} name={item.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{item.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {item.preview}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
