import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:3000/api/tasks";
const AUTH_API = "http://localhost:3000/api/auth";

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("taskflow_token") || "",
  );
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("LOGIN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [checkingSession, setCheckingSession] = useState(
    Boolean(localStorage.getItem("taskflow_token")),
  );

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [view, setView] = useState("BOARD");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function logout() {
    localStorage.removeItem("taskflow_token");
    setToken("");
    setUser(null);
    setTasks([]);
    setPassword("");
    setError("");
    setLoading(false);
  }

  async function handleAuth(event) {
    event.preventDefault();
    if (authLoading) return;

    setAuthLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${AUTH_API}/${authMode === "LOGIN" ? "login" : "register"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            authMode === "LOGIN"
              ? { email, password }
              : { name, email, password },
          ),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      localStorage.setItem("taskflow_token", data.token);
      setUser(data.user);
      setToken(data.token);
      setPassword("");
    } catch (err) {
      setError(err.message || "Could not connect to the server");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadTasks() {
    if (!token) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) throw new Error("Could not load tasks");

      setTasks(await response.json());
      setError("");
    } catch {
      setError("Cannot load tasks. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadTasks();
  }, [token]);

  useEffect(() => {
    if (!token) {
      setCheckingSession(false);
      setUser(null);
      return;
    }

    let cancelled = false;

    fetch(`${AUTH_API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function createTask(event) {
    event.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, priority, dueDate }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create task");

      setTasks((current) => [...current, data]);
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
    } catch (err) {
      setError(err.message || "Could not create task");
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(id, changes) {
    try {
      const response = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changes),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");

      setTasks((current) =>
        current.map((task) => (task.id === id ? data : task)),
      );
      setError("");
    } catch (err) {
      setError(err.message || "Could not update task");
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task permanently?")) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Delete failed");
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (err) {
      setError(err.message || "Could not delete task");
    }
  }

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesStatus = filter === "ALL" || task.status === filter;
        const text = `${task.title} ${task.description}`.toLowerCase();
        return matchesStatus && text.includes(search.toLowerCase());
      }),
    [tasks, filter, search],
  );

  const columns = [
    { id: "TODO", label: "To do", color: "#64748b" },
    { id: "IN_PROGRESS", label: "In progress", color: "#6366f1" },
    { id: "DONE", label: "Done", color: "#16a34a" },
  ];

  const formatDuration = (milliseconds) => {
    const totalSeconds = Math.floor((milliseconds || 0) / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  };

  const elapsed = (task) => {
    const saved = task.stageTimes?.[task.status] || 0;
    const active = task.stageStartedAt
      ? Math.max(0, Date.now() - task.stageStartedAt)
      : 0;
    const total = saved + active;
    const hours = Math.floor(total / 3600000);
    const minutes = Math.floor((total % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    progress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: tasks.filter((t) => t.status === "DONE").length,
  };
  const getStageTime = (task, stage) => {
    const saved = task.stageTimes?.[stage] || 0;
    const active =
      task.status === stage && task.stageStartedAt
        ? Math.max(0, Date.now() - task.stageStartedAt)
        : 0;
    return saved + active;
  };

  const averageTime = (items, getTime) => {
    if (!items.length) return 0;
    return items.reduce((sum, task) => sum + getTime(task), 0) / items.length;
  };

  const avgTodo = averageTime(tasks, (t) => getStageTime(t, "TODO"));

  const inProgressTasks = tasks.filter(
    (t) => t.status === "IN_PROGRESS" || (t.stageTimes?.IN_PROGRESS || 0) > 0,
  );
  const avgInProgress = averageTime(inProgressTasks, (t) =>
    getStageTime(t, "IN_PROGRESS"),
  );

  const completedTasks = tasks.filter((t) => t.status === "DONE");
  const avgCompletion = averageTime(
    completedTasks,
    (t) =>
      getStageTime(t, "TODO") +
      getStageTime(t, "IN_PROGRESS") +
      getStageTime(t, "DONE"),
  );
  if (checkingSession) {
    return (
      <div className="tf-auth-page">
        <div className="tf-auth-card">
          <h1>TaskFlow</h1>
          <p>Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="tf-auth-page">
        <form className="tf-auth-card" onSubmit={handleAuth}>
          <div className="tf-logo">T</div>
          <h1>Welcome to TaskFlow</h1>
          <p className="tf-muted">
            Sign in to manage your tasks and track your progress.
          </p>

          {authMode === "REGISTER" && (
            <>
              <label htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </>
          )}

          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete={
              authMode === "LOGIN" ? "current-password" : "new-password"
            }
            minLength={8}
            maxLength={72}
            required
          />

          {error && <div className="tf-error">{error}</div>}

          <button className="tf-primary" type="submit" disabled={authLoading}>
            {authLoading
              ? "Please wait..."
              : authMode === "LOGIN"
                ? "Log in"
                : "Create account"}
          </button>

          <p className="tf-auth-switch">
            {authMode === "LOGIN"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "LOGIN" ? "REGISTER" : "LOGIN");
                setError("");
              }}
            >
              {authMode === "LOGIN" ? "Register" : "Log in"}
            </button>
          </p>
        </form>
      </div>
    );
  }
  return (
    <div className="tf-app">
      <header className="tf-header">
        <div className="tf-brand">
          <div className="tf-logo">T</div>
          <div>
            <h1>TaskFlow</h1>
            <p>Make work flow.</p>
          </div>
        </div>
        <div className="tf-live">
          <span /> Workspace active
          <span>{user.name}</span>
          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="tf-main">
        <section className="tf-welcome">
          <div>
            <p className="tf-eyebrow">YOUR WORKSPACE</p>
            <h2>Plan it. Track it. Finish it.</h2>
            <p className="tf-muted">
              All your work, moving in the right direction.
            </p>
          </div>
          <div className="tf-date">
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </section>

        <section className="tf-stats">
          {[
            ["Total tasks", stats.total, "All work items", "#6366f1"],
            ["To do", stats.todo, "Waiting to start", "#64748b"],
            ["In progress", stats.progress, "Currently active", "#d97706"],
            ["Completed", stats.done, "Successfully finished", "#16a34a"],
            [
              "Avg To Do Time",
              formatDuration(avgTodo),
              "Average time in To Do",
              "#64748b",
            ],
            [
              "Avg In Progress",
              formatDuration(avgInProgress),
              "Average time in progress",
              "#d97706",
            ],
            [
              "Avg Completion",
              formatDuration(avgCompletion),
              "Total time for completed tasks",
              "#16a34a",
            ],
          ].map(([label, value, hint, color]) => (
            <div className="tf-stat" key={label}>
              <div className="tf-stat-top">
                <span>{label}</span>
                <i style={{ background: color }} />
              </div>
              <strong>{value}</strong>
              <small>{hint}</small>
            </div>
          ))}
        </section>

        <section className="tf-layout">
          <aside className="tf-panel tf-create">
            <p className="tf-eyebrow">GET STARTED</p>
            <h3>Create a task</h3>
            <p className="tf-muted">Add a new item to your workflow.</p>

            <form onSubmit={createTask}>
              <label>Task title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Prepare project demo"
                required
                maxLength={160}
              />

              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done?"
                rows={3}
              />

              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>

              <label>Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />

              <button className="tf-primary" disabled={saving}>
                {saving ? "Creating..." : "+ Create task"}
              </button>
            </form>
          </aside>

          <section className="tf-panel tf-work">
            <div className="tf-work-head">
              <div>
                <p className="tf-eyebrow">TASK MANAGEMENT</p>
                <h3>
                  Your tasks{" "}
                  <span className="tf-count">{visibleTasks.length}</span>
                </h3>
              </div>

              <div className="tf-views">
                <button
                  className={view === "BOARD" ? "selected" : ""}
                  onClick={() => setView("BOARD")}
                >
                  Board
                </button>

                <button
                  className={view === "LIST" ? "selected" : ""}
                  onClick={() => setView("LIST")}
                >
                  List
                </button>

                <button
                  className={view === "SECTION" ? "selected" : ""}
                  onClick={() => setView("SECTION")}
                >
                  Section
                </button>
              </div>
            </div>

            <input
              className="tf-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="⌕  Search tasks..."
            />

            <div className="tf-filters">
              {[
                ["ALL", "All"],
                ["TODO", "To do"],
                ["IN_PROGRESS", "In progress"],
                ["DONE", "Done"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={filter === id ? "selected" : ""}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && <div className="tf-error">{error}</div>}

            {loading ? (
              <p className="tf-empty">Loading tasks...</p>
            ) : view === "BOARD" ? (
              <div className="tf-board">
                {columns.map((column) => {
                  const items = visibleTasks.filter(
                    (t) => t.status === column.id,
                  );

                  return (
                    <div className="tf-column" key={column.id}>
                      <div className="tf-column-head">
                        <span style={{ background: column.color }} />
                        <strong>{column.label}</strong>
                        <small>{items.length}</small>
                      </div>

                      {items.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          elapsed={elapsed}
                          updateTask={updateTask}
                          deleteTask={deleteTask}
                        />
                      ))}

                      {items.length === 0 && (
                        <div className="tf-column-empty">No tasks here yet</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : view === "SECTION" ? (
              <div className="tf-sections">
                {columns.map((column) => {
                  const items = visibleTasks.filter(
                    (task) => task.status === column.id,
                  );

                  return (
                    <section className="tf-section" key={column.id}>
                      <div className="tf-section-header">
                        <div className="tf-section-title">
                          <span style={{ background: column.color }} />
                          <h3>{column.label}</h3>
                        </div>
                        <span className="tf-section-count">
                          {items.length} tasks
                        </span>
                      </div>

                      <div className="tf-section-content">
                        {items.length > 0 ? (
                          items.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              elapsed={elapsed}
                              updateTask={updateTask}
                              deleteTask={deleteTask}
                              listMode
                            />
                          ))
                        ) : (
                          <p className="tf-empty">No tasks in this section.</p>
                        )}
                      </div>
                    </section>
                  );
                })}

                {visibleTasks.length === 0 && (
                  <p className="tf-empty">
                    No matching tasks. Create one to begin.
                  </p>
                )}
              </div>
            ) : (
              <div className="tf-list">
                {visibleTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    elapsed={elapsed}
                    updateTask={updateTask}
                    deleteTask={deleteTask}
                    listMode
                  />
                ))}

                {visibleTasks.length === 0 && (
                  <p className="tf-empty">
                    No matching tasks. Create one to begin.
                  </p>
                )}
              </div>
            )}

            <div className="tf-footer">
              TaskFlow · Changes are saved to your local backend
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.floor((milliseconds || 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function TaskCard({ task, elapsed, updateTask, deleteTask, listMode = false }) {
  return (
    <article className={`tf-task ${listMode ? "tf-task-row" : ""}`}>
      <div className="tf-task-title">
        <strong>{task.title}</strong>
        <span className={`tf-priority ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </div>

      {task.description && <p className="tf-task-desc">{task.description}</p>}

      <div className="tf-task-meta">
        <span>Current: {elapsed(task)}</span>
        <span>TODO: {formatDuration(task.stageTimes?.TODO)}</span>
        <span>IN_PROGRESS: {formatDuration(task.stageTimes?.IN_PROGRESS)}</span>
        <span>DONE: {formatDuration(task.stageTimes?.DONE)}</span>
        {task.dueDate && <span>Due {task.dueDate}</span>}
      </div>

      <div className="tf-task-actions">
        <select
          aria-label="Task status"
          value={task.status}
          onChange={(e) => updateTask(task.id, { status: e.target.value })}
        >
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </select>

        <select
          aria-label="Edit priority"
          value={task.priority}
          onChange={(e) => updateTask(task.id, { priority: e.target.value })}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        <button className="tf-delete" onClick={() => deleteTask(task.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}
