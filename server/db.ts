import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.fashion_DATABASE_URL || process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export async function initializeDatabase() {
  try {
    if (!process.env.fashion_DATABASE_URL && !process.env.DATABASE_URL) {
      console.warn(
        "fashion_DATABASE_URL or DATABASE_URL not set. Database features will be unavailable. Set DATABASE_URL from Neon to enable.",
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
        payment_intent_id VARCHAR(255),
        payment_amount INTEGER,
        payment_currency VARCHAR(3),
        payment_status VARCHAR(20),
        payment_method_type VARCHAR(50),
        payment_email VARCHAR(254),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '48 hours'),
        deleted_at TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    // Add request_id column if it doesn't exist (for existing tables)
    try {
      await pool.query(`
        ALTER TABLE videos
        ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);
      `);
    } catch (e) {
      console.warn("Column request_id already exists");
    }

    // Add payment columns if they don't exist (for existing tables)
    try {
      await pool.query(`
        ALTER TABLE videos
        ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);
      `);
    } catch (e) {
      console.warn("Column payment_intent_id already exists");
    }

    try {
      await pool.query(`
        ALTER TABLE videos
        ADD COLUMN IF NOT EXISTS payment_amount INTEGER;
      `);
    } catch (e) {
      console.warn("Column payment_amount already exists");
    }

    try {
      await pool.query(`
        ALTER TABLE videos
        ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(3);
      `);
    } catch (e) {
      console.warn("Column payment_currency already exists");
    }

    try {
      await pool.query(`
        ALTER TABLE videos
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20);
      `);
    } catch (e) {
      console.warn("Column payment_status already exists");
    }

    try {
      await pool.query(`
        ALTER TABLE videos
        ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50);
      `);
    } catch (e) {
      console.warn("Column payment_method_type already exists");
    }

    try {
      await pool.query(`
        ALTER TABLE videos
        ADD COLUMN IF NOT EXISTS payment_email VARCHAR(254);
      `);
    } catch (e) {
      console.warn("Column payment_email already exists");
    }

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

    try {
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_payment_intent ON videos(payment_intent_id);`,
      );
    } catch (e) {
      console.warn("Index idx_payment_intent already exists or has issues");
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
