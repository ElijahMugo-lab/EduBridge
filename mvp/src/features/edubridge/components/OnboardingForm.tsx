'use client';

import type { CompressedFile } from '../compress';
import { CameraIcon, FileTextIcon, IdentificationCardIcon } from '@phosphor-icons/react';
import { useState, useTransition } from 'react';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';
import { createProfile } from '../actions';
import { compressImageFile, formatKb, prepareVettingDoc } from '../compress';

const COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Other'];
const GRADES = ['Pre-primary', 'Grades 1-3', 'Grades 4-6', 'Grades 7-9', 'Grades 10-12'];
const PHILOSOPHIES = ['CBC-aligned', 'Montessori', 'Classical', 'Inquiry-based', 'Project-based', 'Faith-based'];

const inputClass = 'w-full rounded-[10px] border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
const labelClass = 'mb-1.5 mt-4 block text-sm font-semibold';

function DocPicker(props: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  value: CompressedFile | null;
  onChange: (file: CompressedFile | null) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-4 rounded-2xl border p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {props.icon}
        {props.label}
      </p>
      {props.value
        ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] bg-muted px-3 py-2">
              <span className="min-w-0 truncate text-sm">{props.value.fileName}</span>
              <span className="shrink-0 font-mono text-xs text-clay">
                {props.value.origKb > props.value.sizeKb + 1 ? `${formatKb(props.value.origKb)} to ${formatKb(props.value.sizeKb)}` : formatKb(props.value.sizeKb)}
              </span>
              <button type="button" className="shrink-0 text-sm font-semibold underline" onClick={() => props.onChange(null)}>
                Remove
              </button>
            </div>
          )
        : (
            <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3 cursor-pointer rounded-full')}>
              {busy ? 'Compressing...' : 'Choose file'}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) {
                    return;
                  }
                  setBusy(true);
                  try {
                    props.onChange(await prepareVettingDoc(file));
                  } catch (error) {
                    props.onError(error instanceof Error ? error.message : 'Could not read that file.');
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
          )}
      <p className="mt-2 text-xs text-muted-foreground">{props.hint}</p>
    </div>
  );
}

export function OnboardingForm(props: { defaultFirst: string; defaultLast: string }) {
  const [role, setRole] = useState<'parent' | 'educator'>('parent');
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<CompressedFile | null>(null);
  const [nationalId, setNationalId] = useState<CompressedFile | null>(null);
  const [goodConduct, setGoodConduct] = useState<CompressedFile | null>(null);
  const [consent, setConsent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError('');
    const base = {
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      county: String(formData.get('county') ?? 'Nairobi'),
      bio: String(formData.get('bio') ?? ''),
      photo: photo?.dataUrl,
    };
    startTransition(async () => {
      let result: { error?: string };
      if (role === 'parent') {
        result = await createProfile({ role: 'parent', ...base });
      } else {
        if (!nationalId || !goodConduct) {
          setError('Both vetting documents are required: national ID and Certificate of Good Conduct.');
          return;
        }
        if (!consent) {
          setError('Tick the consent box so we may process your vetting documents.');
          return;
        }
        result = await createProfile({
          role: 'educator',
          ...base,
          subjects: String(formData.get('subjects') ?? ''),
          gradeLevels: String(formData.get('gradeLevels') ?? ''),
          philosophy: String(formData.get('philosophy') ?? ''),
          hourlyRateKsh: Number(formData.get('hourlyRateKsh') ?? 0),
          tscNumber: String(formData.get('tscNumber') ?? ''),
          nationalId,
          goodConduct,
          consent,
        });
      }
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={submit} className="mx-auto w-full max-w-xl">
      <div className="grid grid-cols-2 gap-2 rounded-full bg-muted p-1" role="radiogroup" aria-label="I am joining as">
        {(['parent', 'educator'] as const).map(r => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            onClick={() => setRole(r)}
            className={cn(
              'rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
              role === r ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {r === 'parent' ? 'I am a parent' : 'I am an educator'}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-[10px] bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ob-first">First name</label>
          <input id="ob-first" name="firstName" defaultValue={props.defaultFirst} required maxLength={60} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="ob-last">Last name</label>
          <input id="ob-last" name="lastName" defaultValue={props.defaultLast} required maxLength={60} className={inputClass} />
        </div>
      </div>

      <label className={labelClass} htmlFor="ob-county">County</label>
      <select id="ob-county" name="county" className={inputClass}>
        {COUNTIES.map(c => <option key={c}>{c}</option>)}
      </select>

      <label className={labelClass} htmlFor="ob-photo">Profile photo</label>
      <div className="flex items-center gap-3">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.dataUrl} alt="Profile preview" className="size-14 rounded-full object-cover" />
        )}
        <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-pointer rounded-full')}>
          <CameraIcon className="size-4" aria-hidden />
          {photo ? 'Replace photo' : 'Upload photo'}
          <input
            id="ob-photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) {
                return;
              }
              try {
                setPhoto(await compressImageFile(file, 512, 120));
              } catch {
                setError('Could not read that image. Try another one.');
              }
            }}
          />
        </label>
        {photo && <span className="font-mono text-xs text-clay">{`${formatKb(photo.origKb)} to ${formatKb(photo.sizeKb)}`}</span>}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">Compressed on your device before upload.</p>

      {role === 'educator' && (
        <>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="ob-subjects">Subjects</label>
              <input id="ob-subjects" name="subjects" required placeholder="Mathematics, Physics" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="ob-rate">Hourly rate (KSh)</label>
              <input id="ob-rate" name="hourlyRateKsh" type="number" min={100} max={100000} required placeholder="1500" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="ob-grades">Grade levels</label>
              <select id="ob-grades" name="gradeLevels" className={inputClass}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="ob-philosophy">Teaching philosophy</label>
              <select id="ob-philosophy" name="philosophy" className={inputClass}>
                {PHILOSOPHIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <label className={labelClass} htmlFor="ob-tsc">TSC number</label>
          <input id="ob-tsc" name="tscNumber" required inputMode="numeric" pattern="\d{4,8}" placeholder="654321" className={inputClass} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Checked against the TSC register during review.
          </p>

          <DocPicker
            label="National ID"
            hint="Photo or PDF. Never shown publicly; reviewed once, then used only for your vetted badge."
            icon={<IdentificationCardIcon className="size-4.5 text-clay" aria-hidden />}
            value={nationalId}
            onChange={setNationalId}
            onError={setError}
          />
          <DocPicker
            label="Certificate of Good Conduct"
            hint="Your DCI police clearance certificate, verified during review."
            icon={<FileTextIcon className="size-4.5 text-clay" aria-hidden />}
            value={goodConduct}
            onChange={setGoodConduct}
            onError={setError}
          />

          <div className="mt-4 rounded-2xl bg-muted p-4">
            <label htmlFor="ob-consent" className="flex cursor-pointer items-start gap-3">
              <input
                id="ob-consent"
                type="checkbox"
                checked={consent}
                onChange={event => setConsent(event.target.checked)}
                className="mt-0.5 size-4.5 shrink-0 accent-primary"
              />
              <span className="text-sm leading-relaxed">
                I consent to EduBridge collecting and storing my national ID, Certificate of
                Good Conduct and TSC number
                {' '}
                <b>for the sole purpose of verifying my identity and professional standing</b>
                , as provided by the Data Protection Act, 2019.
              </span>
            </label>
            <p className="mt-2.5 pl-7.5 text-xs leading-relaxed text-muted-foreground">
              Your documents are never shown publicly. Only EduBridge vetting reviewers see
              them, they are not shared with third parties, and you can withdraw consent and
              have them deleted at any time by emailing privacy@edubridge.co.ke.
            </p>
          </div>
        </>
      )}

      <label className={labelClass} htmlFor="ob-bio">
        {role === 'parent' ? 'About your family (optional)' : 'Your teaching, in your own words'}
      </label>
      <textarea
        id="ob-bio"
        name="bio"
        rows={4}
        required={role === 'educator'}
        maxLength={1000}
        placeholder={role === 'parent'
          ? 'What are you looking for in an educator?'
          : 'Experience, approach, and what a typical lesson with you looks like.'}
        className={inputClass}
      />

      <button
        type="submit"
        disabled={pending}
        className={cn(buttonVariants({ size: 'lg' }), 'mt-6 w-full rounded-full font-semibold')}
      >
        {pending ? 'Saving...' : role === 'parent' ? 'Create my account' : 'Submit for vetting'}
      </button>
      {role === 'educator' && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Your profile stays hidden from parents until our review approves it.
        </p>
      )}
    </form>
  );
}
