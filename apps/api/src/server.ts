import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// SQLite setup (stable file path inside apps/api)
const dbPath = path.join(__dirname, "../skillcanvas.db");
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
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ ok: false, error: "text is required" });
  }

  const createdAt = new Date().toISOString();

  const stmt = db.prepare("INSERT INTO messages (text, created_at) VALUES (?, ?)");
  const info = stmt.run(text.trim(), createdAt);

  const item = {
    id: Number(info.lastInsertRowid),
    text: text.trim(),
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

app.put("/messages/:id", (req, res) => {
  const id = Number(req.params.id);
  const { text } = req.body ?? {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: "valid id is required" });
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ ok: false, error: "text is required" });
  }

  const trimmed = text.trim();

  const updateStmt = db.prepare("UPDATE messages SET text = ? WHERE id = ?");
  const info = updateStmt.run(trimmed, id);

  if (info.changes === 0) {
    return res.status(404).json({ ok: false, error: "message not found" });
  }

  const row = db
    .prepare("SELECT id, text, created_at FROM messages WHERE id = ?")
    .get(id) as { id: number; text: string; created_at: string };

  const item = {
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
  };

  res.json({ ok: true, item });
});

app.delete("/messages/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: "valid id is required" });
  }

  const stmt = db.prepare("DELETE FROM messages WHERE id = ?");
  const info = stmt.run(id);

  if (info.changes === 0) {
    return res.status(404).json({ ok: false, error: "message not found" });
  }

  res.json({ ok: true, deletedId: id });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`SQLite DB at: ${dbPath}`);
});