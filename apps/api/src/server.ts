import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_fallback";

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "skillcanvas-api" });
});

// ---------- GitHub OAuth ----------
app.get("/auth/github", (_req, res) => {
  const redirectUri = `http://localhost:${PORT}/auth/github/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || "",
    redirect_uri: redirectUri,
    scope: "read:user user:email",
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get("/auth/github/callback", async (req, res) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.status(400).json({ error: "Missing OAuth code" });
    }

    const redirectUri = `http://localhost:${PORT}/auth/github/callback`;

    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token as string | undefined;

    if (!accessToken) {
      return res.status(400).json({ error: "No access token", tokenData });
    }

    const userResp = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    const ghUser = await userResp.json();

    const appToken = jwt.sign(
      {
        id: ghUser.id,
        login: ghUser.login,
        name: ghUser.name,
        avatar_url: ghUser.avatar_url,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", appToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true with HTTPS in production
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error("GitHub auth failed:", error);
    return res.status(500).json({ error: "GitHub auth failed" });
  }
});

// Current user
app.get("/me", (req, res) => {
  try {
    const token = req.cookies.token as string | undefined;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const user = jwt.verify(token, JWT_SECRET);
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Logout
app.post("/logout", (_req, res) => {
  res.clearCookie("token");
  return res.json({ ok: true });
});

// ---------- Temporary Notes API ----------
type Note = { id: number; title: string; content: string };

let notes: Note[] = [
  { id: 1, title: "Welcome", content: "SkillCanvas note API is working." },
];

app.get("/notes", (_req, res) => {
  return res.json({ notes });
});

app.post("/notes", (req, res) => {
  const { title, content } = req.body || {};
  const newNote: Note = {
    id: Date.now(),
    title: String(title || "").trim(),
    content: String(content || "").trim(),
  };

  notes.unshift(newNote);
  return res.status(201).json({ note: newNote });
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});