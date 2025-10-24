import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function initializeDatabase() {
  try {
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
        INDEX idx_email (email),
        INDEX idx_expires_at (expires_at),
        INDEX idx_created_at (created_at),
        UNIQUE(video_id)
      );
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
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
