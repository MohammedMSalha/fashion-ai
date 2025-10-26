import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.fashion_DATABASE_URL || process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 5, // Reduced for serverless (cold starts)
  min: 0, // No idle connections
  idleTimeoutMillis: 10000, // Shorter idle timeout
  connectionTimeoutMillis: 3000,
  statementTimeoutMillis: 5000,
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
      console.log("[DB] No DATABASE_URL set - database features disabled");
      initialized = true;
      return;
    }

    console.log("[DB] Initializing database connection...");

    // Try to connect with short timeout
    try {
      const client = await Promise.race([
        pool.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 3000),
        ),
      ]);

      await client.query("SELECT 1");
      client.release();

      console.log("[DB] ✓ Connection verified");

      // Initialize tables in the background (non-blocking)
      initializeTables().catch((err) => {
        console.error("[DB] Background table init error:", err);
      });
    } catch (connError) {
      console.warn(
        "[DB] Connection failed (will retry on first query):",
        (connError as Error).message,
      );
      // Don't fail - let queries retry
    }

    initialized = true;
  } catch (error) {
    console.warn("[DB] Initialization error:", error);
    initialized = true;
  }
}

async function initializeTables() {
  try {
    // Create videos table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        email VARCHAR(254) NOT NULL,
        image_data BYTEA,
        image_base64 TEXT,
        video_url TEXT,
        request_id VARCHAR(255),
        duration INTEGER NOT NULL,
        resolution VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'awaiting_payment',
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
      "image_data BYTEA",
      "image_base64 TEXT",
    ];

    for (const column of columnsToAdd) {
      try {
        const [colName] = column.split(" ");
        await pool.query(
          `ALTER TABLE videos ADD COLUMN IF NOT EXISTS ${column};`,
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
