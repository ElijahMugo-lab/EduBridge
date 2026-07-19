import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/features/edubridge/components/OnboardingForm';
import { getSessionUser } from '@/features/edubridge/queries';

export const metadata = {
  title: 'Join EduBridge',
  description: 'Create your parent or educator profile.',
};

export default async function OnboardingPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const session = await getSessionUser();
  if (!session) {
    redirect('/sign-in');
  }
  if (session.profile) {
    redirect('/dashboard');
  }
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Welcome to EduBridge</h1>
      <p className="mt-2 text-muted-foreground">
        Tell us who you are. Educators go through a short vetting review before parents can find them.
      </p>
      <div className="mt-8">
        <OnboardingForm defaultFirst={session.firstName} defaultLast={session.lastName} />
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
