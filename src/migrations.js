import pool from './db.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id VARCHAR UNIQUE,
        email VARCHAR UNIQUE NOT NULL,
        name VARCHAR NOT NULL,
        picture VARCHAR,
        is_active BOOLEAN DEFAULT true,
        role VARCHAR DEFAULT 'EMPLOYEE' CHECK (role IN ('EMPLOYEE', 'ADMIN')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        type VARCHAR NOT NULL CHECK (type IN ('ENTRY', 'EXIT')),
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        is_valid BOOLEAN DEFAULT true,
        notes TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS failed_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        user_email VARCHAR,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        reason VARCHAR NOT NULL,
        distance_meters FLOAT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS location_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        radius_meters FLOAT DEFAULT 100,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('Migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
