import "dotenv/config";
import pg from "pg";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL_UNPOOLED / DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const tables = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`);
console.log("TABLES:", tables.rows.map((r) => r.table_name).join(", "));

const enums = await client.query(`
  SELECT t.typname
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typtype = 'e'
  ORDER BY t.typname
`);
console.log("ENUMS:", enums.rows.map((r) => r.typname).join(", "));

try {
  const mig = await client.query(`
    SELECT migration_name,
           finished_at IS NOT NULL AS finished,
           rolled_back_at IS NOT NULL AS rolled_back,
           logs
    FROM _prisma_migrations
    ORDER BY started_at
  `);
  console.log("MIGRATIONS:", JSON.stringify(mig.rows, null, 2));
} catch (e) {
  console.log("MIGRATIONS TABLE ERROR:", e.message);
}

try {
  const cols = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Feedback'
    ORDER BY ordinal_position
  `);
  console.log(
    "Feedback columns:",
    cols.rows.map((r) => r.column_name).join(", "),
  );
} catch (e) {
  console.log("Feedback cols error:", e.message);
}

const expectedTables = [
  "Workspace",
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "Feedback",
  "Theme",
  "FeedbackTheme",
  "Report",
  "Invitation",
  "_prisma_migrations",
];
const present = new Set(tables.rows.map((r) => r.table_name));
const missing = expectedTables.filter((t) => !present.has(t));
const extra = [...present].filter((t) => !expectedTables.includes(t));
console.log("MISSING TABLES:", missing.join(", ") || "(none)");
console.log("EXTRA TABLES:", extra.join(", ") || "(none)");

await client.end();
