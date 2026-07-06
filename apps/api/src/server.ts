import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

type MessageItem = {
  id: number;
  text: string;
  createdAt: string;
};

const messages: MessageItem[] = [];
let nextId = 1;

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

  const item: MessageItem = {
    id: nextId++,
    text,
    createdAt: new Date().toISOString(),
  };

  messages.unshift(item);
  res.status(201).json({ ok: true, item });
});

app.get("/messages", (_req, res) => {
  res.json({ ok: true, items: messages });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
