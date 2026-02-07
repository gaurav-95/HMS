const Database = require("better-sqlite3");
const path = process.argv[2] || "data/gss-hms.db";
const db = new Database(path);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables.map(t => t.name).join(", "));

const rx = db.prepare("SELECT COUNT(*) as c FROM prescriptions").get();
const bil = db.prepare("SELECT COUNT(*) as c FROM billing_records").get();
console.log("Prescriptions:", rx.c, "| Billing records:", bil.c);
db.close();
