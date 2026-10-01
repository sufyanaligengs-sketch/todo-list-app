const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const clearCompleted = document.getElementById("clearCompleted");

const filters = document.querySelectorAll(".filter");

let tasks = [];

let currentFilter = "all";


// =========================
// GET TASKS FROM BACKEND
// =========================

async function loadTasks() {

    try {

        const response = await fetch("/api/tasks");

        if (!response.ok) {
            throw new Error("Gagal mengambil data");
        }

        tasks = await response.json();

        renderTasks();

    } catch (error) {

        console.error(error);

        taskList.innerHTML = `
            <li class="empty-message">
                Gagal mengambil data dari server.
            </li>
        `;

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

    try {

        const response = await fetch("/api/tasks", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text: text
            })

        });


        if (!response.ok) {
            throw new Error("Gagal menambahkan task");
        }


        const newTask = await response.json();


        tasks.unshift(newTask);

        taskInput.value = "";

        renderTasks();

        taskInput.focus();

    } catch (error) {

        console.error(error);

        alert("Gagal menambahkan task.");

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


    try {

        const response = await fetch(`/api/tasks/${id}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                text: task.text,

                completed: !task.completed

            })

        });


        if (!response.ok) {
            throw new Error("Gagal mengubah task");
        }


        const updatedTask = await response.json();


        tasks = tasks.map(task => {

            if (task.id === id) {
                return updatedTask;
            }

            return task;

        });


        renderTasks();

    } catch (error) {

        console.error(error);

        alert("Gagal mengubah task.");

    }
}


// =========================
// DELETE TASK
// =========================

async function deleteTask(id) {

    try {

        const response = await fetch(`/api/tasks/${id}`, {

            method: "DELETE"

        });


        if (!response.ok) {
            throw new Error("Gagal menghapus task");
        }


        tasks = tasks.filter(task => task.id !== id);

        renderTasks();

    } catch (error) {

        console.error(error);

        alert("Gagal menghapus task.");

    }
}


// =========================
// CLEAR COMPLETED
// =========================

async function clearCompletedTasks() {

    try {

        const response = await fetch(
            "/api/tasks/completed/all",
            {
                method: "DELETE"
            }
        );


        if (!response.ok) {
            throw new Error(
                "Gagal menghapus completed tasks"
            );
        }


        tasks = tasks.filter(task => !task.completed);

        renderTasks();

    } catch (error) {

        console.error(error);

        alert("Gagal menghapus completed tasks.");

    }
}


// =========================
// FILTER
// =========================

function getFilteredTasks() {

    if (currentFilter === "active") {

        return tasks.filter(
            task => !task.completed
        );

    }


    if (currentFilter === "completed") {

        return tasks.filter(
            task => task.completed
        );

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

        const emptyMessage =
            document.createElement("li");

        emptyMessage.className =
            "empty-message";

        emptyMessage.textContent =
            "No tasks found.";

        taskList.appendChild(
            emptyMessage
        );

    } else {

        filteredTasks.forEach(task => {

            const li =
                document.createElement("li");

            li.className = "task";


            if (task.completed) {

                li.classList.add("completed");

            }


            // LEFT

            const leftSide =
                document.createElement("div");

            leftSide.className =
                "task-left";


            // CHECKBOX

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";

            checkbox.className =
                "task-checkbox";

            checkbox.checked =
                task.completed;


            checkbox.addEventListener(
                "change",
                () => toggleTask(task.id)
            );


            // TEXT

            const text =
                document.createElement("span");

            text.className =
                "task-text";

            text.textContent =
                task.text;


            // DELETE

            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "delete-button";

            deleteButton.textContent = "×";

            deleteButton.title =
                "Delete task";


            deleteButton.addEventListener(
                "click",
                () => deleteTask(task.id)
            );


            leftSide.appendChild(
                checkbox
            );

            leftSide.appendChild(
                text
            );


            li.appendChild(
                leftSide
            );

            li.appendChild(
                deleteButton
            );


            taskList.appendChild(
                li
            );

        });

    }


    updateTaskCount();
}


// =========================
// TASK COUNT
// =========================

function updateTaskCount() {

    const activeTasks =
        tasks.filter(
            task => !task.completed
        ).length;


    if (activeTasks === 1) {

        taskCount.textContent =
            "1 task left";

    } else {

        taskCount.textContent =
            `${activeTasks} tasks left`;

    }
}


// =========================
// EVENTS
// =========================

addButton.addEventListener(
    "click",
    addTask
);


taskInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            addTask();

        }

    }
);


clearCompleted.addEventListener(
    "click",
    clearCompletedTasks
);


filters.forEach(filter => {

    filter.addEventListener(
        "click",
        () => {

            filters.forEach(button => {

                button.classList.remove(
                    "active"
                );

            });


            filter.classList.add(
                "active"
            );


            currentFilter =
                filter.dataset.filter;


            renderTasks();

        }
    );

});


// =========================
// START
// =========================

loadTasks();