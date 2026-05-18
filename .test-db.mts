import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

const url = process.env.DIRECT_DATABASE_URL;
if (!url) {
  console.error('No DIRECT_DATABASE_URL');
  process.exit(1);
}
const masked = url.replace(/:([^@]+)@/, ':***@');
console.log('Connecting:', masked);

const sql = postgres(url, { max: 1, idle_timeout: 5 });
try {
  const r = await sql`SELECT current_database() as db, current_schema() as schema`;
  console.log('OK connected. db:', r[0].db, 'schema:', r[0].schema);
  const t = await sql`SELECT COUNT(*)::int as n FROM subaruclub.models`;
  console.log('subaruclub.models rows:', t[0].n);
} catch (e: any) {
  console.error('ERR:', e.code || '', e.message);
  process.exit(1);
} finally {
  await sql.end();
}
