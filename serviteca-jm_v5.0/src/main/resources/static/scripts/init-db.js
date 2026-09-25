const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/serviteca';
const pool = new Pool({ connectionString });

async function main() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schema);
    console.log('Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('No se pudo inicializar la base de datos:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
