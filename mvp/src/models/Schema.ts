import { integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// EduBridge MVP schema.
// To modify: update this file, then run `npm run db:generate` to create a migration.
// Migrations are applied automatically when the dev server starts (db-server:file).

// One row per user (Clerk user id) or per seeded demo educator (id prefixed "seed-").
export const profileSchema = pgTable('profile', {
  userId: text('user_id').primaryKey(),
  role: text('role').notNull(), // 'parent' | 'educator' | 'admin'
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().default(''),
  county: text('county').notNull().default('Nairobi'),
  bio: text('bio').notNull().default(''),
  photo: text('photo'), // compressed data URL or https URL (seeds)
  // Educator-only fields
  subjects: text('subjects').notNull().default(''), // comma-separated
  gradeLevels: text('grade_levels').notNull().default(''),
  philosophy: text('philosophy').notNull().default(''), // e.g. CBC-aligned, Montessori, Classical
  hourlyRateKsh: integer('hourly_rate_ksh'),
  tscNumber: text('tsc_number').notNull().default(''),
  // Vetting: educators start 'pending' and stay out of the Agora until 'verified'.
  // Parents do not need vetting and are created as 'verified'.
  status: text('status').notNull().default('pending'), // 'pending' | 'verified' | 'rejected'
  verifiedAt: timestamp('verified_at', { mode: 'date' }),
  // When the educator consented to processing of their vetting documents
  // (Kenya Data Protection Act, 2019). Null for parents (no documents).
  consentAt: timestamp('consent_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Vetting documents, compressed client-side before upload (canvas JPEG pipeline).
export const vettingDocSchema = pgTable('vetting_doc', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  kind: text('kind').notNull(), // 'national_id' | 'good_conduct'
  fileName: text('file_name').notNull(),
  mime: text('mime').notNull(),
  dataUrl: text('data_url').notNull(),
  sizeKb: integer('size_kb').notNull(),
  origKb: integer('orig_kb').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, table => [
  uniqueIndex('vetting_doc_user_kind_idx').on(table.userId, table.kind),
]);

// One thread per parent+educator pair.
export const threadSchema = pgTable('thread', {
  id: serial('id').primaryKey(),
  parentUserId: text('parent_user_id').notNull(),
  educatorUserId: text('educator_user_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, table => [
  uniqueIndex('thread_pair_idx').on(table.parentUserId, table.educatorUserId),
]);

export const messageSchema = pgTable('message', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id').notNull(),
  senderUserId: text('sender_user_id').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Double-blind ratings: a rating is revealed only once both sides of the thread
// have submitted, or 14 days after submission (computed at query time).
export const ratingSchema = pgTable('rating', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id').notNull(),
  raterUserId: text('rater_user_id').notNull(),
  rateeUserId: text('ratee_user_id').notNull(),
  stars: integer('stars').notNull(), // 1..5
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, table => [
  uniqueIndex('rating_once_idx').on(table.threadId, table.raterUserId),
]);
