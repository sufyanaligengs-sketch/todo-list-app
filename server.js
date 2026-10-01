const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();

const PORT = 3000;

// =========================
// DATABASE
// =========================

const db = new Database("todo.db");

// Membuat tabel jika belum ada
db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0
    )
`).run();


// =========================
// MIDDLEWARE
// =========================

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));


// =========================
// GET ALL TASKS
// =========================

app.get("/api/tasks", (req, res) => {

    const tasks = db.prepare(`
        SELECT
            id,
            text,
            completed
        FROM tasks
        ORDER BY id DESC
    `).all();

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

app.post("/api/tasks", (req, res) => {

    const { text } = req.body;

    if (!text || text.trim() === "") {

        return res.status(400).json({
            message: "Task tidak boleh kosong"
        });

    }

    const result = db.prepare(`
        INSERT INTO tasks (text, completed)
        VALUES (?, 0)
    `).run(text.trim());

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

    console.log(`Server berjalan di http://localhost:${PORT}`);

});