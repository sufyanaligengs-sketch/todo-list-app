const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const clearCompleted = document.getElementById("clearCompleted");

const filters = document.querySelectorAll(".filter");

let tasks = [];
let currentFilter = "all";

// =========================
// AUTHENTICATION
// =========================

const loginPage = document.getElementById("loginPage");
const registerPage = document.getElementById("registerPage");
const todoPage = document.getElementById("todoPage");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");

const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerButton = document.getElementById("registerButton");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const logoutButton = document.getElementById("logoutButton");

// =========================
// SHOW REGISTER
// =========================

showRegister.addEventListener("click", () => {
    loginPage.style.display = "none";
    registerPage.style.display = "block";
    todoPage.style.display = "none";
});

// =========================
// SHOW LOGIN
// =========================

showLogin.addEventListener("click", () => {
    registerPage.style.display = "none";
    loginPage.style.display = "block";
    todoPage.style.display = "none";
});

// =========================
// REGISTER
// =========================

registerButton.addEventListener("click", async () => {
    const email = registerEmail.value.trim();
    const password = registerPassword.value;

    if (!email || !password) {
        alert("Email dan password wajib diisi.");
        return;
    }

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

       try {
    const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            text: text
        })
    });

    const responseText = await response.text();

    console.log("STATUS ADD TASK:", response.status);
    console.log("RESPONSE ADD TASK:", responseText);

    let data;

    try {
        data = JSON.parse(responseText);
    } catch (error) {
        throw new Error(
            "Server mengembalikan HTML, bukan JSON. Status: " +
            response.status
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message || "Gagal menambahkan task."
        );
    }

    tasks.unshift(data);

    taskInput.value = "";

    renderTasks();

    taskInput.focus();

} catch (error) {
    console.error("ERROR ADD TASK:", error);
    alert("Gagal menambahkan task: " + error.message);
}

    } catch (error) {
        console.error("ERROR REGISTER:", error);
        alert("Gagal terhubung ke server.");
    }
});

// =========================
// LOGIN
// =========================

loginButton.addEventListener("click", async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        alert("Email dan password wajib diisi.");
        return;
    }

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login gagal.");
            return;
        }

        localStorage.setItem("token", data.token);

        loginEmail.value = "";
        loginPassword.value = "";

        loginPage.style.display = "none";
        registerPage.style.display = "none";
        todoPage.style.display = "block";

        await loadTasks();

    } catch (error) {
        console.error("ERROR LOGIN:", error);
        alert("Gagal terhubung ke server.");
    }
});

// =========================
// LOGOUT
// =========================

logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");

    tasks = [];

    taskList.innerHTML = "";

    todoPage.style.display = "none";
    registerPage.style.display = "none";
    loginPage.style.display = "block";
});

// =========================
// GET TASKS
// =========================

async function loadTasks() {
    const token = localStorage.getItem("token");

    if (!token) {
        return;
    }

    try {
        const response = await fetch("/api/tasks", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                tasks = [];

                todoPage.style.display = "none";
                registerPage.style.display = "none";
                loginPage.style.display = "block";

                alert("Sesi login sudah tidak valid. Silakan login kembali.");
                return;
            }

            throw new Error(data.message || "Gagal mengambil data.");
        }

        tasks = data;

        renderTasks();

    } catch (error) {
        console.error("ERROR LOAD TASKS:", error);

        taskList.innerHTML = "";

        const errorMessage = document.createElement("li");
        errorMessage.className = "empty-message";
        errorMessage.textContent = "Gagal mengambil data dari server.";

        taskList.appendChild(errorMessage);
    }
}

// =========================
// ADD TASK
// =========================

async function addTask() {
    const text = taskInput.value.trim();

    if (text === "") {
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                text: text
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                tasks = [];

                todoPage.style.display = "none";
                loginPage.style.display = "block";

                alert("Sesi login sudah tidak valid.");
                return;
            }

            throw new Error(data.message || "Gagal menambahkan task.");
        }

        tasks.unshift(data);

        taskInput.value = "";

        renderTasks();

        taskInput.focus();

    } catch (error) {
        console.error("ERROR ADD TASK:", error);
        alert("Gagal menambahkan task: " + error.message);
    }
}

// =========================
// TOGGLE TASK
// =========================

async function toggleTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) {
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                text: task.text,
                completed: !task.completed
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Gagal mengubah task.");
        }

        tasks = tasks.map(currentTask => {
            if (currentTask.id === id) {
                return data;
            }

            return currentTask;
        });

        renderTasks();

    } catch (error) {
        console.error("ERROR UPDATE TASK:", error);
        alert("Gagal mengubah task: " + error.message);
    }
}

// =========================
// DELETE TASK
// =========================

async function deleteTask(id) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Gagal menghapus task.");
        }

        tasks = tasks.filter(task => task.id !== id);

        renderTasks();

    } catch (error) {
        console.error("ERROR DELETE TASK:", error);
        alert("Gagal menghapus task: " + error.message);
    }
}

// =========================
// CLEAR COMPLETED
// =========================

async function clearCompletedTasks() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    try {
        const response = await fetch(
            "/api/tasks/completed/all",
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Gagal menghapus completed tasks."
            );
        }

        tasks = tasks.filter(task => !task.completed);

        renderTasks();

    } catch (error) {
        console.error("ERROR CLEAR COMPLETED:", error);
        alert(
            "Gagal menghapus completed tasks: " +
            error.message
        );
    }
}

// =========================
// FILTER
// =========================

function getFilteredTasks() {
    if (currentFilter === "active") {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

// =========================
// RENDER
// =========================

function renderTasks() {
    taskList.innerHTML = "";

    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        const emptyMessage = document.createElement("li");

        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "No tasks found.";

        taskList.appendChild(emptyMessage);

    } else {
        filteredTasks.forEach(task => {
            const li = document.createElement("li");

            li.className = "task";

            if (task.completed) {
                li.classList.add("completed");
            }

            const leftSide = document.createElement("div");

            leftSide.className = "task-left";

            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.className = "task-checkbox";
            checkbox.checked = task.completed;

            checkbox.addEventListener("change", () => {
                toggleTask(task.id);
            });

            const text = document.createElement("span");

            text.className = "task-text";
            text.textContent = task.text;

            const deleteButton = document.createElement("button");

            deleteButton.className = "delete-button";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete task";

            deleteButton.addEventListener("click", () => {
                deleteTask(task.id);
            });

            leftSide.appendChild(checkbox);
            leftSide.appendChild(text);

            li.appendChild(leftSide);
            li.appendChild(deleteButton);

            taskList.appendChild(li);
        });
    }

    updateTaskCount();
}

// =========================
// TASK COUNT
// =========================

function updateTaskCount() {
    const activeTasks =
        tasks.filter(task => !task.completed).length;

    if (activeTasks === 1) {
        taskCount.textContent = "1 task left";
    } else {
        taskCount.textContent = `${activeTasks} tasks left`;
    }
}

// =========================
// EVENTS
// =========================

addButton.addEventListener("click", addTask);

taskInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addTask();
    }
});

clearCompleted.addEventListener(
    "click",
    clearCompletedTasks
);

filters.forEach(filter => {
    filter.addEventListener("click", () => {
        filters.forEach(button => {
            button.classList.remove("active");
        });

        filter.classList.add("active");

        currentFilter = filter.dataset.filter;

        renderTasks();
    });
});

// =========================
// START APPLICATION
// =========================

const savedToken = localStorage.getItem("token");

if (savedToken) {
    loginPage.style.display = "none";
    registerPage.style.display = "none";
    todoPage.style.display = "block";

    loadTasks();
} else {
    loginPage.style.display = "block";
    registerPage.style.display = "none";
    todoPage.style.display = "none";
}