# 🚀 TaskFlow — Smart Task Management

**TaskFlow** is a simple and interactive task-management web application that helps users organize their work, track task progress, and monitor the time spent in different stages of a task.

From creating tasks to tracking their progress, TaskFlow provides a centralized place to manage everyday work efficiently.

## ✨ Features

### 🔐 Authentication & Security
- **User Registration & Login:** Create an account and securely log in using your email and password.
- **Password Hashing:** Uses `bcryptjs` to hash passwords instead of storing them in plain text.
- **JWT Authentication:** Uses JSON Web Tokens (JWT) to authenticate users.
- **User-Specific Tasks:** Each user can access and manage only their own tasks.
- **Logout:** Clear the saved authentication token and return to the login screen.

### 📋 Task Management
- **Create Tasks:** Add tasks with a title, description, priority, and due date.
- **Edit Tasks:** Update task details, status, and priority.
- **Delete Tasks:** Remove tasks when they are no longer needed.
- **Priority Management:** Organize tasks based on their importance.
- **Status Tracking:** Track tasks as they progress through different stages.

### 📊 Organization & Productivity
- **Kanban Board View:** Visualize tasks by their current status.
- **List View:** View tasks in a structured list.
- **Section View:** Organize tasks into sections.
- **Search & Filtering:** Quickly find tasks and filter the displayed results.
- **Stage-Time Tracking:** Record and display how much time tasks spend in different stages.
- **SLA Metrics:** View stage-timing information to understand task progress and identify delays.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Builds the interactive user interface |
| Vite | Frontend development server and build tool |
| JavaScript (JSX) | Implements frontend functionality |
| CSS | Handles styling, layout, and responsiveness |
| Node.js | Runs the backend server |
| Express.js | Builds the REST API |
| JSON Files | Store user and task data locally |
| bcryptjs | Hashes and verifies passwords |
| JSON Web Token (JWT) | Handles token-based authentication |
| LocalStorage | Stores the authentication token in the browser |

## 🏗️ How It Works

TaskFlow follows a client-server architecture.

1. **Frontend:** Users interact with the application through a React-based interface.
2. **API Requests:** The frontend sends HTTP requests to the Express.js backend.
3. **Authentication:** The backend verifies JWTs before allowing access to protected task endpoints.
4. **Data Storage:** The backend reads and updates local JSON files containing user and task data.
5. **Response:** The backend returns JSON responses, and React updates the interface accordingly.

### Application Flow

```text
                 ┌──────────────────────┐
                 │      User / Browser  │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    React + Vite      │
                 │      Frontend        │
                 └──────────┬───────────┘
                            │ HTTP Requests
                            ▼
                 ┌──────────────────────┐
                 │    Node.js +         │
                 │    Express.js        │
                 │      Backend         │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   JWT Authentication │
                 │   & Task Processing  │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    JSON File Storage │
                 │  users.json          │
                 │  tasks.json           │
                 └──────────────────────┘
```

## 📁 Project Structure

```text
TaskFlow/
├── client/
│   └── src/
│       ├── App.jsx          # Main React application
│       └── App.css          # Application styling
│
├── server/
│   ├── src/
│   │   └── index.js         # Express server and API routes
│   ├── tasks.json           # Local task data (generated/used)
│   └── users.json           # Local user data (generated/used)
│
├── README.md
└── .gitignore
```

*Note: The JSON data files may be created when the backend runs.*

## ⚙️ Getting Started

Follow these steps to run TaskFlow locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js and npm](https://nodejs.org/)
- Git
- A modern web browser
- A code editor such as VS Code

Verify your installation:

```bash
node --version
npm --version
```

### 1. Clone the Repository

```bash
git clone https://github.com/katherin915/TaskFlow.git
cd TaskFlow
```

### 2. Start the Backend

Open a terminal and navigate to the server directory:

```bash
cd server
npm install
```

Set a development JWT secret and start the server.

**Windows PowerShell:**

```powershell
$env:JWT_SECRET = "replace-this-with-a-random-secret-at-least-32-characters-long"
node src/index.js
```

**Important:** Replace the example secret with your own randomly generated secret. Keep it private and never commit it to GitHub.

The backend is expected to run on:

```text
http://localhost:3000
```

### 3. Start the Frontend

Open a second terminal and navigate to the client directory:

```bash
cd client
npm install
npm run dev
```

Vite will display the local development URL in the terminal. It is usually:

```text
http://localhost:5173
```

Open that address in your browser.

**Keep both terminals running while using the application.**

## 🧭 How to Use TaskFlow

1. **Register:** Create a new account using your email and password.
2. **Log In:** Sign in to access your tasks.
3. **Create a Task:** Enter the task title, description, priority, and due date.
4. **Track Progress:** Update the task status as work progresses.
5. **Choose a View:** Switch between Board, List, and Section views.
6. **Find Tasks:** Use search and filters to locate specific tasks.
7. **Monitor Stage Timing:** Review the time spent in different task stages.
8. **Manage Tasks:** Edit task details or delete tasks when needed.
9. **Log Out:** End your session when you are finished.

## 🔌 API Endpoints

TaskFlow uses a REST API built with Express.js.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate a user and return a token |
| `GET` | `/api/auth/me` | Get the currently authenticated user's information |
| `GET` | `/api/tasks` | Retrieve the authenticated user's tasks |
| `POST` | `/api/tasks` | Create a new task |
| `PATCH` | `/api/tasks/:id` | Update an existing task |
| `DELETE` | `/api/tasks/:id` | Delete a task |

### Authentication Header

Protected task requests require a valid JWT in the authorization header:

```http
Authorization: Bearer YOUR_TOKEN
```

The backend uses this token to authenticate requests and associate task operations with the logged-in user.

## ⏱️ Stage-Time Tracking & SLA

TaskFlow records the time tasks spend in different workflow stages.

For example, a task might move through the following stages:

```text
To Do → In Progress → Completed
```

Stage-time tracking helps answer questions such as:

- How long did a task remain in the To Do stage?
- How much time did it spend In Progress?
- How long did the task take to complete?
- Which stages may be contributing to delays?

This information can help users better understand task progress and workflow efficiency.

*Note: The exact SLA calculations should be verified against the intended requirements. This project does not claim that a particular SLA formula has been independently validated.*

## 🔒 Security & Data Storage

TaskFlow includes basic authentication and user-specific task access, with some limitations appropriate to a local prototype.

- **Password Protection:** Passwords are hashed using `bcryptjs`.
- **Token-Based Authentication:** JWTs protect authenticated API routes.
- **User Isolation:** Task routes are designed to restrict access to the authenticated user's tasks.
- **Local Storage:** User and task data are stored in JSON files rather than a database server.
- **Token Storage:** The frontend stores the authentication token in browser `localStorage`.

### Important Considerations

- Keep `JWT_SECRET` private.
- Do not commit real user data, passwords, tokens, or secrets to GitHub.
- Ensure `server/users.json` and `server/tasks.json` are excluded from version control when they contain private data.
- Browser `localStorage` requires careful handling because an XSS vulnerability could expose stored tokens.
- JSON-file storage is suitable for a small prototype but lacks the transaction and concurrency guarantees expected from a production database.

## 🧪 Testing Checklist

Before submitting or deploying the project, manually verify the following:

- [ ] Register a new user.
- [ ] Log in with valid credentials.
- [ ] Confirm invalid credentials are rejected.
- [ ] Create a task and verify that it appears.
- [ ] Edit task details, status, and priority.
- [ ] Delete a task.
- [ ] Refresh the page and verify data persistence.
- [ ] Log out and log back in.
- [ ] Verify that a second user cannot access or modify another user's tasks.
- [ ] Confirm that protected API requests without a valid token are rejected.
- [ ] Change a task's status and verify stage-time tracking.
- [ ] Check the browser console and backend terminal for errors.

**Testing status:** These checks are a verification checklist. They should be marked complete only after the corresponding tests have actually been performed.

## 🚀 Future Improvements

Possible improvements for future versions include:

- **Database Integration:** Replace JSON files with a database such as PostgreSQL or MongoDB.
- **Automated Testing:** Add backend tests for authentication, task operations, and user isolation.
- **Input Validation:** Improve validation and error handling for user input.
- **Security Hardening:** Add rate limiting and review authentication and token-storage practices.
- **Account Recovery:** Implement email verification and password recovery if required.
- **SLA Enhancements:** Validate timing calculations and introduce configurable stage-level SLA targets.
- **Deployment:** Configure production environments and deploy the application.
- **Accessibility:** Improve keyboard navigation, accessibility, and responsive behavior.

## 👩‍💻 Author

**Katherin Pandey**

- GitHub: [@katherin915](https://github.com/katherin915)

---

### 📌 Project Summary

**TaskFlow** is a React and Node.js task-management application featuring user authentication, task organization, multiple viewing modes, and workflow stage-time tracking.

**Project Status:** Local prototype. Features, security, and test results should be verified before production use.
