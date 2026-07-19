// Applies Drizzle migrations programmatically. Used by the dev db server's
// --run hook because spawning npm.cmd directly fails on Windows (Node >= 20
// throws EINVAL for .cmd files spawned without a shell).
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5433/postgres';

const db = drizzle(databaseUrl);
await migrate(db, { migrationsFolder: './migrations' });
console.warn('Migrations applied');
await db.$client.end();
