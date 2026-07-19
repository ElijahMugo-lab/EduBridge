'use client';

import { ChatCircleTextIcon, PaperPlaneRightIcon, StarIcon } from '@phosphor-icons/react';
import { useRef, useState, useTransition } from 'react';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';
import { reviewEducator, sendMessage, startThread, submitRating } from '../actions';

// REQ-2.3: the primary CTA on an educator profile.
export function MessageEducatorButton(props: { educatorUserId: string; disabled?: boolean; disabledReason?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  return (
    <div>
      <button
        type="button"
        disabled={pending || props.disabled}
        title={props.disabled ? props.disabledReason : undefined}
        className={cn(buttonVariants({ size: 'lg' }), 'w-full rounded-full font-semibold sm:w-auto')}
        onClick={() => startTransition(async () => {
          const result = await startThread(props.educatorUserId);
          if (result?.error) {
            setError(result.error);
          }
        })}
      >
        <ChatCircleTextIcon className="size-4.5" aria-hidden />
        {pending ? 'Opening...' : 'Message educator'}
      </button>
      {props.disabled && props.disabledReason && (
        <p className="mt-2 text-xs text-muted-foreground">{props.disabledReason}</p>
      )}
      {error && <p role="alert" className="mt-2 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

// REQ-3.1: plain text composer. No attachments, no typing indicators, no read receipts.
export function Composer(props: { threadId: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  function send() {
    const body = ref.current?.value.trim() ?? '';
    if (!body) {
      return;
    }
    startTransition(async () => {
      const result = await sendMessage(props.threadId, body);
      if (result.error) {
        setError(result.error);
      } else {
        setError('');
        if (ref.current) {
          ref.current.value = '';
        }
      }
    });
  }
  return (
    <div className="border-t p-3">
      {error && <p role="alert" className="mb-2 text-sm font-medium text-destructive">{error}</p>}
      <form
        className="flex items-end gap-2"
        action={send}
      >
        <textarea
          ref={ref}
          rows={1}
          required
          maxLength={4000}
          placeholder="Write a message"
          aria-label="Message"
          className="max-h-40 min-h-11 w-full flex-1 resize-y rounded-[10px] border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Send message"
          className={cn(buttonVariants({ size: 'icon-lg' }), 'rounded-full')}
        >
          <PaperPlaneRightIcon weight="fill" className="size-4.5" aria-hidden />
        </button>
      </form>
    </div>
  );
}

// Epic 4: star picker shown once a thread is old enough.
export function RatingPrompt(props: { threadId: number; otherName: string }) {
  const [hover, setHover] = useState(0);
  const [chosen, setChosen] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  return (
    <div className="border-t bg-muted/50 px-4 py-3">
      <p className="text-sm font-semibold">
        How has working with
        {' '}
        {props.otherName}
        {' '}
        been?
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Ratings are double-blind: they see yours only after rating you back, or after 14 days.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div role="radiogroup" aria-label="Rating from 1 to 5 stars" className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={chosen === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setChosen(n)}
              className="p-0.5"
            >
              <StarIcon
                weight={(hover || chosen) >= n ? 'fill' : 'regular'}
                className={cn('size-6', (hover || chosen) >= n ? 'text-primary' : 'text-muted-foreground')}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!chosen || pending}
          className={cn(buttonVariants({ size: 'sm' }), 'rounded-full font-semibold')}
          onClick={() => startTransition(async () => {
            const result = await submitRating(props.threadId, chosen);
            if (result.error) {
              setError(result.error);
            }
          })}
        >
          {pending ? 'Sending...' : 'Submit rating'}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function ReviewButtons(props: { educatorUserId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  function decide(decision: 'verified' | 'rejected') {
    startTransition(async () => {
      const result = await reviewEducator(props.educatorUserId, decision);
      if (result.error) {
        setError(result.error);
      }
    });
  }
  return (
    <div>
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={() => decide('verified')} className={cn(buttonVariants({ size: 'sm' }), 'rounded-full font-semibold')}>
          Approve
        </button>
        <button type="button" disabled={pending} onClick={() => decide('rejected')} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full font-semibold text-destructive')}>
          Reject
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
