import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("nabung_pintar.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    saved_amount REAL DEFAULT 0,
    deadline DATE,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    target_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_id) REFERENCES targets(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth API ---
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, password);
      res.json({ id: info.lastInsertRowid, name, email });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // --- Transactions API ---
  app.get("/api/transactions", (req, res) => {
    const userId = req.query.userId;
    const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC").all(userId);
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { userId, type, category, amount, description, date, targetId } = req.body;
    const info = db.prepare(`
      INSERT INTO transactions (user_id, type, category, amount, description, date, target_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, type, category, amount, description, date, targetId);
    
    // If it's income linked to a target, update the target's saved_amount
    if (type === 'income' && targetId) {
      db.prepare("UPDATE targets SET saved_amount = saved_amount + ? WHERE id = ?").run(amount, targetId);
    }

    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- Targets API ---
  app.get("/api/targets", (req, res) => {
    const userId = req.query.userId;
    const targets = db.prepare("SELECT * FROM targets WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json(targets);
  });

  app.post("/api/targets", (req, res) => {
    const { userId, name, amount, deadline, description } = req.body;
    const info = db.prepare(`
      INSERT INTO targets (user_id, name, amount, deadline, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, name, amount, deadline, description);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/targets/:id", (req, res) => {
    const { saved_amount, status } = req.body;
    if (saved_amount !== undefined) {
      db.prepare("UPDATE targets SET saved_amount = ? WHERE id = ?").run(saved_amount, req.params.id);
    }
    if (status !== undefined) {
      db.prepare("UPDATE targets SET status = ? WHERE id = ?").run(status, req.params.id);
    }
    res.json({ success: true });
  });

  // --- Dashboard Stats API ---
  app.get("/api/stats", (req, res) => {
    const userId = req.query.userId;
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const totalIncome = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income'").get(userId).total || 0;
    const totalExpense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense'").get(userId).total || 0;
    
    const monthlyIncome = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income' AND date >= ?").get(userId, monthStart).total || 0;
    const monthlyExpense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date >= ?").get(userId, monthStart).total || 0;

    res.json({
      balance: totalIncome - totalExpense,
      monthlyIncome,
      monthlyExpense,
      totalIncome,
      totalExpense
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
