import { SealCheckIcon, StarIcon } from '@phosphor-icons/react/dist/ssr';

// Small shared presentational pieces. Server-safe: no state, no handlers.

export function Avatar(props: { photo?: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = props.size === 'lg' ? 'size-20 text-2xl' : props.size === 'sm' ? 'size-9 text-xs' : 'size-12 text-sm';
  if (props.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={props.photo} alt={props.name} className={`${sizeClass} shrink-0 rounded-full object-cover`} />
    );
  }
  const initials = props.name.split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <span aria-hidden className={`${sizeClass} grid shrink-0 place-items-center rounded-full bg-secondary font-semibold text-secondary-foreground`}>
      {initials}
    </span>
  );
}

// The PRD's "Laurel Wreath": rendered as a seal-check vetted badge in EduBridge branding.
export function VettedBadge(props: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-[0.62rem] tracking-wide text-clay uppercase">
      <SealCheckIcon weight="fill" className="size-3.5" aria-hidden />
      {props.compact ? 'Vetted' : 'Vetted educator'}
    </span>
  );
}

export function Stars(props: { avg: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <StarIcon weight="fill" className="size-4 text-primary" aria-hidden />
      <b>{props.avg.toFixed(1)}</b>
      <span className="text-muted-foreground">
        (
        {props.count}
        )
      </span>
    </span>
  );
}

export function EmptyState(props: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <p className="font-semibold">{props.title}</p>
      {props.children && <div className="mt-2 text-sm text-muted-foreground">{props.children}</div>}
    </div>
  );
}
