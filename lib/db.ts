import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
});

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                TEXT PRIMARY KEY,
      email             TEXT UNIQUE NOT NULL,
      name              TEXT,
      image             TEXT,
      stripe_customer_id TEXT,
      tier              TEXT NOT NULL DEFAULT 'explorer',
      created_at        BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())
    );
    CREATE TABLE IF NOT EXISTS deals (
      id         TEXT NOT NULL,
      user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      data       JSONB NOT NULL,
      created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()),
      updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()),
      PRIMARY KEY (id, user_email)
    );
  `);
  tableReady = true;
}

export type Tier = "explorer" | "searcher" | "broker" | "institutional";

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  stripe_customer_id: string | null;
  tier: Tier;
  created_at: number;
}

export const userDb = {
  async upsert(user: { id: string; email: string; name?: string | null; image?: string | null }): Promise<UserRow> {
    await ensureTable();
    await pool.query(
      `INSERT INTO users (id, email, name, image)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT(email) DO UPDATE SET
         name  = COALESCE(EXCLUDED.name, users.name),
         image = COALESCE(EXCLUDED.image, users.image)`,
      [user.id, user.email, user.name ?? null, user.image ?? null]
    );
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [user.email]);
    return rows[0] as UserRow;
  },

  async getByEmail(email: string): Promise<UserRow | null> {
    await ensureTable();
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return (rows[0] as UserRow) ?? null;
  },

  async getByStripeCustomerId(customerId: string): Promise<UserRow | null> {
    await ensureTable();
    const { rows } = await pool.query("SELECT * FROM users WHERE stripe_customer_id = $1", [customerId]);
    return (rows[0] as UserRow) ?? null;
  },

  async setStripeCustomerId(email: string, customerId: string): Promise<void> {
    await ensureTable();
    await pool.query("UPDATE users SET stripe_customer_id = $1 WHERE email = $2", [customerId, email]);
  },

  async setTier(email: string, tier: Tier): Promise<void> {
    await ensureTable();
    await pool.query("UPDATE users SET tier = $1 WHERE email = $2", [tier, email]);
  },
};

export const dealDb = {
  async list(userEmail: string): Promise<unknown[]> {
    await ensureTable();
    const { rows } = await pool.query(
      "SELECT data FROM deals WHERE user_email = $1 ORDER BY created_at ASC",
      [userEmail]
    );
    return rows.map(r => r.data);
  },

  async upsert(userEmail: string, deal: { id: string; [key: string]: unknown }): Promise<void> {
    await ensureTable();
    await pool.query(
      `INSERT INTO deals (id, user_email, data, updated_at)
       VALUES ($1, $2, $3, EXTRACT(EPOCH FROM NOW()))
       ON CONFLICT (id, user_email) DO UPDATE SET
         data = EXCLUDED.data,
         updated_at = EXCLUDED.updated_at`,
      [deal.id, userEmail, JSON.stringify(deal)]
    );
  },

  async delete(userEmail: string, id: string): Promise<void> {
    await ensureTable();
    await pool.query("DELETE FROM deals WHERE id = $1 AND user_email = $2", [id, userEmail]);
  },
};

export default pool;
