
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, "..");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    "Set JWT_SECRET to a random secret of at least 32 characters."
  );
  process.exit(1);
}

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));

function readFile(file) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "[]");
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readTasks() {
  return readFile(TASKS_FILE);
}

function saveTasks(tasks) {
  saveFile(TASKS_FILE, tasks);
}

function readUsers() {
  return readFile(USERS_FILE);
}

function saveUsers(users) {
  saveFile(USERS_FILE, users);
}

function createToken(user) {
  return jwt.sign(
    { sub: user.id },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Please log in" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = readUsers().find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      error: "Session expired or invalid. Please log in again.",
    });
  }
}

app.get("/", (req, res) => {
  res.send("TaskFlow backend is working!");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "TaskFlow API is running" });
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        error: "Enter a name, valid email, and password of 8–72 characters.",
      });
    }

    const users = readUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email === normalizedEmail)) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    saveUsers(users);

    res.status(201).json({
      token: createToken(user),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ error: "Could not create account." });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = readUsers().find(
      (u) => u.email === normalizedEmail
    );

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    res.json({
      token: createToken(user),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ error: "Could not log in." });
  }
});

// Get current user
app.get("/api/auth/me", authRequired, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

// All task routes below require authentication.
app.get("/api/tasks", authRequired, (req, res) => {
  const tasks = readTasks().filter(
    (task) => task.userId === req.user.id
  );
  res.json(tasks);
});

app.post("/api/tasks", authRequired, (req, res) => {
  const {
    title,
    description = "",
    priority = "MEDIUM",
    dueDate = "",
  } = req.body || {};

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Task title is required" });
  }

  if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
    return res.status(400).json({ error: "Invalid priority" });
  }

  if (
    typeof description !== "string" ||
    typeof dueDate !== "string"
  ) {
    return res.status(400).json({
      error: "Description and due date must be text.",
    });
  }

  const tasks = readTasks();

  const task = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    title: title.trim(),
    description,
    priority,
    dueDate,
    status: "TODO",
    createdAt: new Date().toISOString(),
    stageStartedAt: Date.now(),
    stageTimes: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
  };

  tasks.push(task);
  saveTasks(tasks);
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", authRequired, (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex(
    (task) =>
      task.id === req.params.id &&
      task.userId === req.user.id
  );

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const task = tasks[index];
  const { title, description, priority, dueDate, status } =
    req.body || {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title cannot be empty" });
    }
    task.title = title.trim();
  }

  if (description !== undefined) {
    if (typeof description !== "string") {
      return res.status(400).json({ error: "Invalid description" });
    }
    task.description = description;
  }

  if (dueDate !== undefined) {
    if (typeof dueDate !== "string") {
      return res.status(400).json({ error: "Invalid due date" });
    }
    task.dueDate = dueDate;
  }

  if (priority !== undefined) {
    if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }
    task.priority = priority;
  }

  if (status !== undefined && status !== task.status) {
    if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const now = Date.now();
    task.stageTimes = task.stageTimes || {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    task.stageTimes[task.status] =
      (task.stageTimes[task.status] || 0) +
      Math.max(0, now - task.stageStartedAt);

    task.status = status;
    task.stageStartedAt = now;
  }

  tasks[index] = task;
  saveTasks(tasks);
  res.json(task);
});

app.delete("/api/tasks/:id", authRequired, (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex(
    (task) =>
      task.id === req.params.id &&
      task.userId === req.user.id
  );

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  tasks.splice(index, 1);
  saveTasks(tasks);
  res.json({ message: "Task deleted" });
});

app.listen(PORT, () => {
  console.log(`TaskFlow API running at http://localhost:${PORT}`);
});
