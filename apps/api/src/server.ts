import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// SQLite setup
const dbPath = path.join(process.cwd(), "skillcanvas.db");
const db = new Database(dbPath);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "skillcanvas-api" });
});

app.post("/echo", (req, res) => {
  const { message } = req.body ?? {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ ok: false, error: "message is required" });
  }

  res.json({
    ok: true,
    echoed: message,
    at: new Date().toISOString(),
  });
});

app.post("/messages", (req, res) => {
  const { text } = req.body ?? {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ ok: false, error: "text is required" });
  }

  const createdAt = new Date().toISOString();

  const stmt = db.prepare(
    "INSERT INTO messages (text, created_at) VALUES (?, ?)"
  );
  const info = stmt.run(text, createdAt);

  const item = {
    id: Number(info.lastInsertRowid),
    text,
    createdAt,
  };

  res.status(201).json({ ok: true, item });
});

app.get("/messages", (_req, res) => {
  const rows = db
    .prepare("SELECT id, text, created_at FROM messages ORDER BY id DESC")
    .all() as Array<{ id: number; text: string; created_at: string }>;

  const items = rows.map((r) => ({
    id: r.id,
    text: r.text,
    createdAt: r.created_at,
  }));

  res.json({ ok: true, items });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`SQLite DB at: ${dbPath}`);
});