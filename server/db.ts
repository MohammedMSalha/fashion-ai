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
        video_url TEXT NOT NULL,
        video_id VARCHAR(255),
        duration INTEGER NOT NULL,
        resolution VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'processing',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '48 hours'),
        deleted_at TIMESTAMP,
        UNIQUE(video_id)
      );
      CREATE INDEX IF NOT EXISTS idx_email ON videos(email);
      CREATE INDEX IF NOT EXISTS idx_expires_at ON videos(expires_at);
      CREATE INDEX IF NOT EXISTS idx_created_at ON videos(created_at);
    `);

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
