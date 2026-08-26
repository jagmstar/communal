const { Client } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Connection string is read from the DATABASE_URL environment variable
// (see src/lib/db/client.ts for the same convention used by the app).
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    'DATABASE_URL environment variable is not set. ' +
      'Please configure it in your .env.local file or Vercel environment variables.'
  );
  process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to Neon. Executing schema...');

  try {
    await client.query(schema);
    console.log('Schema applied successfully.');
  } catch (e) {
    console.error('Schema error:', e.message);
  }

  // Verify
  const meters = await client.query('SELECT count(*) as n FROM meters');
  const readings = await client.query('SELECT count(*) as n FROM readings');
  const tariffs = await client.query('SELECT count(*) as n FROM tariffs');
  const settings = await client.query('SELECT count(*) as n FROM settings');
  console.log(`Meters: ${meters.rows[0].n}, Readings: ${readings.rows[0].n}, Tariffs: ${tariffs.rows[0].n}, Settings: ${settings.rows[0].n}`);

  await client.end();
})();
