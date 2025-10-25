import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.fashion_DATABASE_URL || process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initializeDatabase() {
  // If already initialized, return immediately
  if (initialized) {
    return;
  }

  // If already initializing, wait for it
  if (initPromise) {
    return initPromise;
  }

  initPromise = performInitialization();
  return initPromise;
}

async function performInitialization() {
  try {
    const dbUrl = process.env.fashion_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      console.log("No DATABASE_URL set - database features disabled");
      initialized = true;
      return;
    }

    console.log("Testing database connection...");
    
    // Quick connection test with timeout
    const client = await Promise.race([
      pool.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 5000)
      ),
    ]);

    await client.query("SELECT 1");
    client.release();
    
    console.log("✓ Database connection OK");

    // Initialize tables in the background (non-blocking)
    initializeTables().catch(err => {
      console.error("Background table initialization error:", err);
    });

    initialized = true;
  } catch (error) {
    console.warn("Database initialization error:", error);
    initialized = true; // Mark as initialized even if failed, so we don't retry
  }
}

async function initializeTables() {
  try {
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

    // Try to add columns if they don't exist (ignore errors)
    const columnsToAdd = [
      "request_id VARCHAR(255)",
      "payment_intent_id VARCHAR(255)",
      "payment_amount INTEGER",
      "payment_currency VARCHAR(3)",
      "payment_status VARCHAR(20)",
      "payment_method_type VARCHAR(50)",
      "payment_email VARCHAR(254)",
    ];

    for (const column of columnsToAdd) {
      try {
        const [colName] = column.split(" ");
        await pool.query(
          `ALTER TABLE videos ADD COLUMN IF NOT EXISTS ${column};`
        );
      } catch (e) {
        // Ignore column exists errors
      }
    }

    // Create indexes
    const indexes = [
      "idx_email ON videos(email)",
      "idx_status ON videos(status)",
      "idx_expires_at ON videos(expires_at)",
      "idx_created_at ON videos(created_at)",
      "idx_request_id ON videos(request_id)",
      "idx_payment_intent ON videos(payment_intent_id)",
    ];

    for (const idx of indexes) {
      try {
        await pool.query(`CREATE INDEX IF NOT EXISTS ${idx};`);
      } catch (e) {
        // Ignore index exists errors
      }
    }

    console.log("✓ Database tables initialized");
  } catch (error) {
    console.error("Table initialization error:", error);
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
