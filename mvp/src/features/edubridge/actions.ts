'use server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { messageSchema, profileSchema, ratingSchema, threadSchema, vettingDocSchema } from '@/models/Schema';

const dataUrlField = z.string().startsWith('data:').max(1_500_000, 'File is too large after compression');

const parentProfileInput = z.object({
  role: z.literal('parent'),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  county: z.string().trim().min(1).max(40),
  bio: z.string().trim().max(1000).default(''),
  photo: dataUrlField.optional(),
});

const educatorProfileInput = z.object({
  role: z.literal('educator'),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  county: z.string().trim().min(1).max(40),
  bio: z.string().trim().min(1, 'Tell parents about your teaching').max(1000),
  photo: dataUrlField.optional(),
  subjects: z.string().trim().min(1, 'Add at least one subject').max(200),
  gradeLevels: z.string().trim().min(1).max(60),
  philosophy: z.string().trim().min(1).max(60),
  hourlyRateKsh: z.coerce.number().int().min(100).max(100_000),
  tscNumber: z.string().trim().regex(/^\d{4,8}$/, 'A TSC number is 4 to 8 digits'),
  nationalId: z.object({ fileName: z.string().max(120), mime: z.string().max(60), dataUrl: dataUrlField, sizeKb: z.number(), origKb: z.number() }),
  goodConduct: z.object({ fileName: z.string().max(120), mime: z.string().max(60), dataUrl: dataUrlField, sizeKb: z.number(), origKb: z.number() }),
  consent: z.boolean().refine(v => v === true, 'Tick the consent box so we may process your vetting documents.'),
});

export type CreateProfileInput = z.input<typeof parentProfileInput> | z.input<typeof educatorProfileInput>;

export async function createProfile(input: CreateProfileInput): Promise<{ error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { error: 'You must be signed in.' };
  }
  const parsed = input.role === 'parent'
    ? parentProfileInput.safeParse(input)
    : educatorProfileInput.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }
  const data = parsed.data;
  const email = user.emailAddresses[0]?.emailAddress ?? '';

  await db.insert(profileSchema).values({
    userId: user.id,
    role: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    email,
    county: data.county,
    bio: data.bio,
    photo: data.photo ?? null,
    subjects: data.role === 'educator' ? data.subjects : '',
    gradeLevels: data.role === 'educator' ? data.gradeLevels : '',
    philosophy: data.role === 'educator' ? data.philosophy : '',
    hourlyRateKsh: data.role === 'educator' ? data.hourlyRateKsh : null,
    tscNumber: data.role === 'educator' ? data.tscNumber : '',
    // Parents are active immediately; educators wait for admin vetting (REQ-1.3).
    status: data.role === 'parent' ? 'verified' : 'pending',
    verifiedAt: data.role === 'parent' ? new Date() : null,
    // Explicit, timestamped consent to document processing (Kenya DPA 2019).
    consentAt: data.role === 'educator' ? new Date() : null,
  }).onConflictDoUpdate({
    target: profileSchema.userId,
    set: { firstName: data.firstName, lastName: data.lastName, county: data.county, bio: data.bio, photo: data.photo ?? null },
  });

  if (data.role === 'educator') {
    await db.delete(vettingDocSchema).where(eq(vettingDocSchema.userId, user.id));
    await db.insert(vettingDocSchema).values([
      { userId: user.id, kind: 'national_id', fileName: data.nationalId.fileName, mime: data.nationalId.mime, dataUrl: data.nationalId.dataUrl, sizeKb: Math.round(data.nationalId.sizeKb), origKb: Math.round(data.nationalId.origKb) },
      { userId: user.id, kind: 'good_conduct', fileName: data.goodConduct.fileName, mime: data.goodConduct.mime, dataUrl: data.goodConduct.dataUrl, sizeKb: Math.round(data.goodConduct.sizeKb), origKb: Math.round(data.goodConduct.origKb) },
    ]);
  }
  redirect('/dashboard');
}

export async function startThread(educatorUserId: string) {
  const user = await currentUser();
  if (!user) {
    return { error: 'You must be signed in.' };
  }
  const [me] = await db.select().from(profileSchema).where(eq(profileSchema.userId, user.id));
  if (!me || me.role !== 'parent') {
    return { error: 'Only parents can start a conversation with an educator.' };
  }
  const [educator] = await db.select().from(profileSchema)
    .where(and(eq(profileSchema.userId, educatorUserId), eq(profileSchema.role, 'educator'), eq(profileSchema.status, 'verified')));
  if (!educator) {
    return { error: 'This educator is not available.' };
  }
  const [existing] = await db.select().from(threadSchema)
    .where(and(eq(threadSchema.parentUserId, user.id), eq(threadSchema.educatorUserId, educatorUserId)));
  const thread = existing ?? (await db.insert(threadSchema)
    .values({ parentUserId: user.id, educatorUserId })
    .returning())[0];
  if (!thread) {
    return { error: 'Could not open the conversation. Try again.' };
  }
  redirect(`/messages/${thread.id}`);
}

const messageInput = z.string().trim().min(1).max(4000);

export async function sendMessage(threadId: number, body: string): Promise<{ error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { error: 'You must be signed in.' };
  }
  const parsed = messageInput.safeParse(body);
  if (!parsed.success) {
    return { error: 'Write a message first.' };
  }
  const [thread] = await db.select().from(threadSchema).where(eq(threadSchema.id, threadId));
  if (!thread || (thread.parentUserId !== user.id && thread.educatorUserId !== user.id)) {
    return { error: 'Conversation not found.' };
  }
  await db.insert(messageSchema).values({ threadId, senderUserId: user.id, body: parsed.data });
  revalidatePath(`/messages/${threadId}`);
  return {};
}

export async function submitRating(threadId: number, stars: number): Promise<{ error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { error: 'You must be signed in.' };
  }
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { error: 'Pick between 1 and 5 stars.' };
  }
  const [thread] = await db.select().from(threadSchema).where(eq(threadSchema.id, threadId));
  if (!thread || (thread.parentUserId !== user.id && thread.educatorUserId !== user.id)) {
    return { error: 'Conversation not found.' };
  }
  const ageDays = Math.max(0, (Date.now() - thread.createdAt.getTime()) / (24 * 60 * 60 * 1000));
  if (ageDays < Env.RATING_WINDOW_DAYS) {
    return { error: `Ratings open after the conversation has been active for ${Env.RATING_WINDOW_DAYS} days.` };
  }
  const rateeUserId = thread.parentUserId === user.id ? thread.educatorUserId : thread.parentUserId;
  await db.insert(ratingSchema)
    .values({ threadId, raterUserId: user.id, rateeUserId, stars })
    .onConflictDoNothing();
  revalidatePath(`/messages/${threadId}`);
  return {};
}

async function requireAdmin() {
  const user = await currentUser();
  if (!user) {
    return null;
  }
  const email = (user.emailAddresses[0]?.emailAddress ?? '').toLowerCase();
  const adminList = (Env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const [profile] = await db.select().from(profileSchema).where(eq(profileSchema.userId, user.id));
  return profile?.role === 'admin' || adminList.includes(email) ? user : null;
}

export async function reviewEducator(educatorUserId: string, decision: 'verified' | 'rejected'): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  if (!admin) {
    return { error: 'Admin access only.' };
  }
  await db.update(profileSchema)
    .set({ status: decision, verifiedAt: decision === 'verified' ? new Date() : null })
    .where(and(eq(profileSchema.userId, educatorUserId), eq(profileSchema.role, 'educator')));
  revalidatePath('/admin');
  revalidatePath('/agora');
  return {};
}
