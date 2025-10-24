import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export async function initializeDatabase() {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn(
        "DATABASE_URL not set. Database features will be unavailable. Set DATABASE_URL from Neon to enable.",
      );
      return;
    }

    // Create videos table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        email VARCHAR(254) NOT NULL,
        video_url TEXT,
        video_id VARCHAR(255),
        request_id VARCHAR(255),
        duration INTEGER NOT NULL,
        resolution VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'processing',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '48 hours'),
        deleted_at TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    // Create indexes individually with error handling
    try {
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_email ON videos(email);`,
      );
    } catch (e) {
      console.warn("Index idx_email already exists or has issues");
    }

    try {
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_status ON videos(status);`,
      );
    } catch (e) {
      console.warn("Index idx_status already exists or has issues");
    }

    try {
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_expires_at ON videos(expires_at);`,
      );
    } catch (e) {
      console.warn("Index idx_expires_at already exists or has issues");
    }

    try {
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_created_at ON videos(created_at);`,
      );
    } catch (e) {
      console.warn("Index idx_created_at already exists or has issues");
    }

    try {
      await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_request_id ON videos(request_id);`,
      );
    } catch (e) {
      console.warn("Index idx_request_id already exists or has issues");
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    // Don't throw, allow app to run without DB in dev
  }
}

export async function query(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function getConnection() {
  return pool.connect();
}

export default pool;
