import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

const app = express();

const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: WEB_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

const db = new Database("skillcanvas.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "skillcanvas-api" });
});

app.post("/echo", (req, res) => {
  const message = String(req.body?.message ?? "").trim();
  if (!message) return res.status(400).json({ error: "message is required" });
  res.json({ ok: true, echoed: message, at: new Date().toISOString() });
});

app.get("/messages", (_req, res) => {
  const rows = db
    .prepare("SELECT id, text, created_at as createdAt FROM messages ORDER BY id DESC")
    .all();
  res.json({ ok: true, items: rows });
});

app.post("/messages", (req, res) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "text is required" });

  const info = db
    .prepare("INSERT INTO messages (text, created_at) VALUES (?, datetime('now'))")
    .run(text);

  const item = db
    .prepare("SELECT id, text, created_at as createdAt FROM messages WHERE id = ?")
    .get(info.lastInsertRowid);

  res.status(201).json({ ok: true, item });
});

app.put("/messages/:id", (req, res) => {
  const id = Number(req.params.id);
  const text = String(req.body?.text ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid message id" });
  }
  if (!text) return res.status(400).json({ error: "text is required" });

  const update = db.prepare("UPDATE messages SET text = ? WHERE id = ?").run(text, id);
  if (update.changes === 0) return res.status(404).json({ error: "Message not found" });

  const item = db
    .prepare("SELECT id, text, created_at as createdAt FROM messages WHERE id = ?")
    .get(id);

  res.json({ ok: true, item });
});

app.delete("/messages/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid message id" });
  }

  const del = db.prepare("DELETE FROM messages WHERE id = ?").run(id);
  if (del.changes === 0) return res.status(404).json({ error: "Message not found" });

  res.json({ ok: true, deletedId: id });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`SQLite DB at: ${process.cwd()}/skillcanvas.db`);
});