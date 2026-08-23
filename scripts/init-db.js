const { Client } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://neondb_owner:npg_twkiVDP72ChM@ep-odd-bonus-av2i8qu3.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require';

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
