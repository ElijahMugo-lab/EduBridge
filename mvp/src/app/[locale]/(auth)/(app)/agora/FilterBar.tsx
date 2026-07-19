'use client';

import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { usePathname, useRouter } from 'next/navigation';

// REQ-2.1: dropdown filters for Subject, Grade Level and Teaching Philosophy.
const SUBJECTS = ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'Coding', 'Literacy', 'STEAM'];
const GRADES = ['Pre-primary', 'Grades 1-3', 'Grades 4-6', 'Grades 7-9', 'Grades 10-12'];
const PHILOSOPHIES = ['CBC-aligned', 'Montessori', 'Classical', 'Inquiry-based', 'Project-based', 'Faith-based'];

const selectClass = 'h-11 rounded-[10px] border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function FilterBar(props: { initial: { q?: string; subject?: string; grade?: string; philosophy?: string } }) {
  const router = useRouter();
  const pathname = usePathname();

  function apply(next: Record<string, string | undefined>) {
    const merged = { ...props.initial, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) {
        params.set(key, value);
      }
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        apply({ q: new FormData(event.currentTarget).get('q')?.toString() });
      }}
    >
      <label className="relative block">
        <span className="sr-only">Search by name, subject or county</span>
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          name="q"
          defaultValue={props.initial.q ?? ''}
          placeholder="Search name or county"
          className="h-11 w-full rounded-[10px] border border-input bg-card pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onBlur={(event) => {
            if ((props.initial.q ?? '') !== event.target.value) {
              apply({ q: event.target.value });
            }
          }}
        />
      </label>
      <label className="block">
        <span className="sr-only">Subject</span>
        <select className={`${selectClass} w-full`} value={props.initial.subject ?? ''} onChange={event => apply({ subject: event.target.value || undefined })}>
          <option value="">All subjects</option>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="sr-only">Grade level</span>
        <select className={`${selectClass} w-full`} value={props.initial.grade ?? ''} onChange={event => apply({ grade: event.target.value || undefined })}>
          <option value="">All grade levels</option>
          {GRADES.map(g => <option key={g}>{g}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="sr-only">Teaching philosophy</span>
        <select className={`${selectClass} w-full`} value={props.initial.philosophy ?? ''} onChange={event => apply({ philosophy: event.target.value || undefined })}>
          <option value="">All philosophies</option>
          {PHILOSOPHIES.map(p => <option key={p}>{p}</option>)}
        </select>
      </label>
    </form>
  );
}
