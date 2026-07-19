import { currentUser } from '@clerk/nextjs/server';
import { and, asc, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { messageSchema, profileSchema, ratingSchema, threadSchema, vettingDocSchema } from '@/models/Schema';
import { ensureSeed } from './seed';

export type Profile = typeof profileSchema.$inferSelect;
export type Thread = typeof threadSchema.$inferSelect;
export type Message = typeof messageSchema.$inferSelect;
export type Rating = typeof ratingSchema.$inferSelect;

const DAY_MS = 24 * 60 * 60 * 1000;
export const REVEAL_AFTER_DAYS = 14;

export async function getSessionUser() {
  const user = await currentUser();
  if (!user) {
    return null;
  }
  const email = user.emailAddresses[0]?.emailAddress ?? '';
  const [profile] = await db.select().from(profileSchema).where(eq(profileSchema.userId, user.id));
  const adminList = (Env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const isAdmin = profile?.role === 'admin' || (!!email && adminList.includes(email.toLowerCase()));
  return { clerkId: user.id, email, firstName: user.firstName ?? '', lastName: user.lastName ?? '', profile: profile ?? null, isAdmin };
}

export type AgoraFilters = {
  q?: string;
  subject?: string;
  grade?: string;
  philosophy?: string;
};

// Vetted educators only (REQ-1.3): pending and rejected profiles never appear.
export async function listVettedEducators(filters: AgoraFilters) {
  await ensureSeed();
  const conds = [eq(profileSchema.role, 'educator'), eq(profileSchema.status, 'verified')];
  if (filters.subject) {
    conds.push(ilike(profileSchema.subjects, `%${filters.subject}%`));
  }
  if (filters.grade) {
    conds.push(eq(profileSchema.gradeLevels, filters.grade));
  }
  if (filters.philosophy) {
    conds.push(eq(profileSchema.philosophy, filters.philosophy));
  }
  if (filters.q) {
    const q = `%${filters.q}%`;
    const byText = or(
      ilike(profileSchema.firstName, q),
      ilike(profileSchema.lastName, q),
      ilike(profileSchema.subjects, q),
      ilike(profileSchema.county, q),
    );
    if (byText) {
      conds.push(byText);
    }
  }
  const educators = await db.select().from(profileSchema)
    .where(and(...conds))
    .orderBy(asc(profileSchema.firstName));
  const ratings = await ratingSummaries(educators.map(e => e.userId));
  return educators.map(e => ({ ...e, rating: ratings.get(e.userId) ?? null }));
}

export async function getEducator(userId: string) {
  await ensureSeed();
  const [educator] = await db.select().from(profileSchema)
    .where(and(eq(profileSchema.userId, userId), eq(profileSchema.role, 'educator'), eq(profileSchema.status, 'verified')));
  if (!educator) {
    return null;
  }
  const ratings = await ratingSummaries([userId]);
  return { ...educator, rating: ratings.get(userId) ?? null };
}

// A rating counts toward the public aggregate only once revealed:
// both sides of the thread have rated, or 14 days have passed (REQ-4.2).
function isRevealed(rating: Rating, threadRatings: Rating[]) {
  const counterpart = threadRatings.find(r => r.threadId === rating.threadId && r.raterUserId !== rating.raterUserId);
  return !!counterpart || Date.now() - rating.createdAt.getTime() >= REVEAL_AFTER_DAYS * DAY_MS;
}

export async function ratingSummaries(userIds: string[]) {
  const out = new Map<string, { avg: number; count: number }>();
  if (userIds.length === 0) {
    return out;
  }
  const rows = await db.select().from(ratingSchema).where(inArray(ratingSchema.rateeUserId, userIds));
  if (rows.length === 0) {
    return out;
  }
  const threadIds = [...new Set(rows.map(r => r.threadId))];
  const allInThreads = await db.select().from(ratingSchema).where(inArray(ratingSchema.threadId, threadIds));
  for (const userId of userIds) {
    const revealed = rows.filter(r => r.rateeUserId === userId && isRevealed(r, allInThreads));
    if (revealed.length > 0) {
      out.set(userId, {
        avg: revealed.reduce((s, r) => s + r.stars, 0) / revealed.length,
        count: revealed.length,
      });
    }
  }
  return out;
}

export async function listThreadsFor(userId: string) {
  const threads = await db.select().from(threadSchema)
    .where(or(eq(threadSchema.parentUserId, userId), eq(threadSchema.educatorUserId, userId)))
    .orderBy(desc(threadSchema.createdAt));
  if (threads.length === 0) {
    return [];
  }
  const otherIds = threads.map(t => (t.parentUserId === userId ? t.educatorUserId : t.parentUserId));
  const others = await db.select().from(profileSchema).where(inArray(profileSchema.userId, otherIds));
  const lastMessages = await db.select().from(messageSchema)
    .where(inArray(messageSchema.threadId, threads.map(t => t.id)))
    .orderBy(desc(messageSchema.createdAt));
  return threads.map(t => ({
    thread: t,
    other: others.find(p => p.userId === (t.parentUserId === userId ? t.educatorUserId : t.parentUserId)) ?? null,
    lastMessage: lastMessages.find(m => m.threadId === t.id) ?? null,
  }));
}

export async function getThreadForUser(threadId: number, userId: string) {
  const [thread] = await db.select().from(threadSchema).where(eq(threadSchema.id, threadId));
  if (!thread || (thread.parentUserId !== userId && thread.educatorUserId !== userId)) {
    return null;
  }
  const otherId = thread.parentUserId === userId ? thread.educatorUserId : thread.parentUserId;
  const [other] = await db.select().from(profileSchema).where(eq(profileSchema.userId, otherId));
  const messages = await db.select().from(messageSchema)
    .where(eq(messageSchema.threadId, threadId))
    .orderBy(asc(messageSchema.createdAt));
  const ratings = await db.select().from(ratingSchema).where(eq(ratingSchema.threadId, threadId));
  const mine = ratings.find(r => r.raterUserId === userId) ?? null;
  const theirs = ratings.find(r => r.raterUserId !== userId) ?? null;
  // Clamp: timestamps can read slightly ahead of Date.now() across timezones.
  const ageDays = Math.max(0, (Date.now() - thread.createdAt.getTime()) / DAY_MS);
  return {
    thread,
    other: other ?? null,
    messages,
    rating: {
      eligible: ageDays >= Env.RATING_WINDOW_DAYS && !mine,
      mine,
      // Double-blind: the received rating is hidden until I have rated too,
      // or 14 days have passed since it was submitted.
      received: theirs && (mine || Date.now() - theirs.createdAt.getTime() >= REVEAL_AFTER_DAYS * DAY_MS)
        ? theirs
        : null,
      waitingOnOther: !!mine && !theirs,
    },
  };
}

// Admin: pending educators with their vetting documents.
export async function listPendingEducators() {
  const pending = await db.select().from(profileSchema)
    .where(and(eq(profileSchema.role, 'educator'), eq(profileSchema.status, 'pending')))
    .orderBy(asc(profileSchema.createdAt));
  if (pending.length === 0) {
    return [];
  }
  const docs = await db.select().from(vettingDocSchema)
    .where(inArray(vettingDocSchema.userId, pending.map(p => p.userId)));
  return pending.map(p => ({ profile: p, docs: docs.filter(d => d.userId === p.userId) }));
}

// Admin quality alert (REQ-4.3): any user whose revealed average drops below 3.5.
export async function listLowRatedUsers() {
  const rated = await db.select().from(ratingSchema);
  if (rated.length === 0) {
    return [];
  }
  const userIds = [...new Set(rated.map(r => r.rateeUserId))];
  const summaries = await ratingSummaries(userIds);
  const flagged = [...summaries.entries()].filter(([, s]) => s.avg < 3.5);
  if (flagged.length === 0) {
    return [];
  }
  const profiles = await db.select().from(profileSchema)
    .where(inArray(profileSchema.userId, flagged.map(([id]) => id)));
  return flagged.map(([userId, summary]) => ({
    profile: profiles.find(p => p.userId === userId) ?? null,
    ...summary,
  }));
}
