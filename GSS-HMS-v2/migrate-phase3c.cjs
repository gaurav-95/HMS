/**
 * Phase 3c Migration: Add unit_cost column + update defaults for inventory/billing
 * Run: node migrate-phase3c.cjs <path-to-db>
 */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.argv[2] || path.join(__dirname, "data", "gss-hms.db");
console.log("Migrating:", dbPath);

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const migrations = [
  // Add unit_cost to inventory_items if not exists
  {
    check: "SELECT COUNT(*) as cnt FROM pragma_table_info('inventory_items') WHERE name='unit_cost'",
    sql: "ALTER TABLE inventory_items ADD COLUMN unit_cost REAL NOT NULL DEFAULT 0",
    desc: "Add unit_cost column to inventory_items"
  },
];

for (const m of migrations) {
  const result = db.prepare(m.check).get();
  if (result.cnt === 0) {
    db.exec(m.sql);
    console.log("  ✔", m.desc);
  } else {
    console.log("  ─ Already done:", m.desc);
  }
}

console.log("Migration complete!");
db.close();
