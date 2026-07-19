// Empties all EduBridge tables on the local dev database (keeps the schema).
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5433/postgres' });
await client.connect();
for (const table of ['message', 'thread', 'rating', 'vetting_doc', 'profile']) {
  await client.query(`DELETE FROM "${table}"`);
}
console.warn('Local tables emptied');
await client.end();
