require("dotenv").config();

console.log("JWT SECRET TERBACA:", !!process.env.JWT_SECRET);

const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const app = express();
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3000;
console.log("SERVER TODO APP V2 AKTIF");

// =========================
// DATABASE
// =========================

const db = new Database("todo.db");

// Membuat tabel jika belum ada


db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`).run();


// =========================
// MIDDLEWARE
// =========================

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// =========================
// REGISTER
// =========================

app.post("/api/register", async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email dan password wajib diisi"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password minimal 6 karakter"
        });
    }

    const existingUser = db.prepare(`
        SELECT id
        FROM users
        WHERE email = ?
    `).get(email);

    if (existingUser) {
        return res.status(400).json({
            message: "Email sudah terdaftar"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

   console.log("JWT USER:", req.user);
console.log("TEXT TASK:", text);

const result = db.prepare(`
    INSERT INTO tasks (user_id, text, completed)
    VALUES (?, ?, 0)
`).run(
    req.user.userId,
    text.trim()
);const task = db.prepare(`
        SELECT id, text, completed
        FROM tasks
        WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
        id: task.id,
        text: task.text,
        completed: Boolean(task.completed)
    });
});
    

// =========================
// LOGIN
// =========================

app.post("/api/login", async (req, res) => {

    console.log("POST /api/login terpanggil");
    console.log("LOGIN BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email dan password wajib diisi"
        });
    }

    const user = db.prepare(`
        SELECT id, email, password
        FROM users
        WHERE email = ?
    `).get(email);

    if (!user) {
        return res.status(401).json({
            message: "Email atau password salah"
        });
    }

    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        return res.status(401).json({
            message: "Email atau password salah"
        });
    }

    const token = jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

    res.json({
        message: "Login berhasil",
        token: token
    });
});


// =========================
// AUTHENTICATION MIDDLEWARE
// =========================

function authenticateToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token tidak ditemukan"
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, user) => {

            if (err) {
                return res.status(403).json({
                    message: "Token tidak valid"
                });
            }

            req.user = user;

            next();
        }
    );
}

// =========================
// GET ALL TASKS
// =========================



app.get("/api/tasks", authenticateToken, (req, res) => {

   const tasks = db.prepare(`
    SELECT
        id,
        text,
        completed
    FROM tasks
    WHERE user_id = ?
    ORDER BY id DESC
`).all(req.user.userId);

    // SQLite menggunakan 0 dan 1
    // Kita ubah menjadi false dan true
    const formattedTasks = tasks.map(task => ({
        id: task.id,
        text: task.text,
        completed: Boolean(task.completed)
    }));

    res.json(formattedTasks);
});

// =========================
// ADD TASK
// =========================

app.post("/api/tasks", authenticateToken, (req, res) => {
    console.log("POST /api/tasks TERPANGGIL");
    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    console.log("JWT USER:", req.user);
    console.log("TEXT TASK:", text);
    const { text } = req.body;

    if (!text || text.trim() === "") {
        return res.status(400).json({
            message: "Task tidak boleh kosong"
        });
    }


    const result = db.prepare(`
        INSERT INTO tasks (user_id, text, completed)
        VALUES (?, ?, 0)
    `).run(
        req.user.userId,
        text.trim()
    );

    const task = db.prepare(`
        SELECT id, text, completed
        FROM tasks
        WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
        id: task.id,
        text: task.text,
        completed: Boolean(task.completed)
    });
});

// =========================
// UPDATE TASK
// =========================

app.put("/api/tasks/:id", (req, res) => {

    const id = Number(req.params.id);

    const { text, completed } = req.body;

    const existingTask = db.prepare(`
        SELECT *
        FROM tasks
        WHERE id = ?
    `).get(id);

    if (!existingTask) {

        return res.status(404).json({
            message: "Task tidak ditemukan"
        });

    }

    db.prepare(`
        UPDATE tasks
        SET text = ?, completed = ?
        WHERE id = ?
    `).run(
        text ?? existingTask.text,
        completed ? 1 : 0,
        id
    );

    const updatedTask = db.prepare(`
        SELECT id, text, completed
        FROM tasks
        WHERE id = ?
    `).get(id);

    res.json({
        id: updatedTask.id,
        text: updatedTask.text,
        completed: Boolean(updatedTask.completed)
    });
});


// =========================
// DELETE TASK
// =========================

app.delete("/api/tasks/:id", (req, res) => {

    const id = Number(req.params.id);

    const result = db.prepare(`
        DELETE FROM tasks
        WHERE id = ?
    `).run(id);

    if (result.changes === 0) {

        return res.status(404).json({
            message: "Task tidak ditemukan"
        });

    }

    res.json({
        message: "Task berhasil dihapus"
    });
});


// =========================
// CLEAR COMPLETED
// =========================

app.delete("/api/tasks/completed/all", (req, res) => {

    db.prepare(`
        DELETE FROM tasks
        WHERE completed = 1
    `).run();

    res.json({
        message: "Completed tasks berhasil dihapus"
    });
});


// =========================
// START SERVER
// =========================

app.listen(PORT, () => {

    console.log(`Server berjalan di port http:// ${PORT}`);

});

  app.use('/api', (req, res) => {
      res.status(404).json({ message: 'Route tidak ditemukan: ' + req.method + ' ' + req.originalUrl });
  });

app.use((err, req, res, next) => {
    console.error("ERROR SERVER:", err);

    res.status(500).json({
        message: "Terjadi error di server",
        error: err.message
    });
});
