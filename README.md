
TaskFlow
TaskFlow is a simple task-management web application. It helps users create and manage tasks, organize them by status and priority, and view how long tasks spend in different stages.

This README describes the implementation currently built in this project. It does not claim that unimplemented features or unrun tests are complete.

1. Features
Register and log in: Create an account and sign in with an email and password.
Password hashing: The backend uses bcryptjs to hash passwords instead of saving plain-text passwords.
Token-based authentication: The backend issues JSON Web Tokens (JWTs). The frontend sends the token when calling protected task APIs.
User-specific tasks: Task API routes filter tasks by the authenticated user.
Create tasks: Add a title, description, priority, and due date.
Edit tasks: Update task details, status, or priority.
Delete tasks: Remove a task.
Task views: Switch between Board/Kanban, List, and Section views.
Search and filtering: Find tasks and filter the displayed task list.
Stage timing / SLA information: The app records time spent in task stages and displays timing metrics.
Logout: Clear the saved login token and return to the authentication screen.
2. Technology stack
Part	Technology	What it does
Frontend	React	Builds the interactive user interface.
Frontend tooling	Vite	Runs the frontend development server and builds the frontend.
Frontend language	JavaScript (JSX)	Implements React components and application behavior.
Styling	CSS	Controls layout, colors, spacing, and responsive presentation.
Backend	Node.js	Runs the server-side JavaScript.
Backend framework	Express	Defines the HTTP API routes.
Data storage	JSON files	Stores task and user data locally in files.
Password security	bcryptjs	Hashes and verifies passwords.
Authentication	jsonwebtoken	Creates and verifies signed login tokens.
How the parts work together
The user opens the React frontend in a browser.
The frontend sends HTTP requests to the Express backend.
The backend validates login tokens for protected task routes.
The backend reads or updates the local JSON data files.
The backend returns JSON responses, and React updates the screen.
3. Project structure
The exact structure can vary slightly, but the main files used by this implementation are expected to look similar to this:

TaskFlow/
├── client/
│   └── src/
│       ├── App.jsx       # Main React app, views, forms, and task interactions
│       └── App.css       # Application styling
├── server/
│   ├── src/
│   │   └── index.js      # Express server, authentication, and task API
│   ├── tasks.json        # Local task data (created/used by the backend)
│   └── users.json        # Local user data (created/used by the backend)
├── README.md
└── .gitignore
tasks.json and users.json may be created when the backend runs. Keep real user data and secrets out of Git.

4. Requirements
Install these before running the project:

Node.js and npm
A web browser
A terminal such as the VS Code terminal
Check your installation:

node --version
npm --version
5. Run the project locally
Open two terminals in your editor: one for the backend and one for the frontend.

A. Start the backend
Open a terminal in the server folder.

Install the backend dependencies:

npm install
Set a development JWT secret and start the server.

Windows PowerShell:

$env:JWT_SECRET = "replace-this-with-a-random-secret-at-least-32-characters-long"
node src/index.js
Use your own random secret. Do not commit it to GitHub or share it publicly. This environment variable applies to the current PowerShell session; set it again when opening a new terminal.

The backend is expected to listen on port 3000.

B. Start the frontend
Open a second terminal in the client folder.

Install the frontend dependencies:

npm install
Start Vite:

npm run dev
Open the local URL printed by Vite in the terminal, usually http://localhost:5173.

Keep both terminals running while using the app.

6. Using TaskFlow
Open the frontend URL in your browser.
Choose Register to create an account, or Log in if you already have one.
Create a task by entering its details and choosing a priority.
Change a task's status as work progresses.
Use the Board, List, and Section views to organize tasks.
Search or filter tasks to find specific work.
Review the stage-timing information shown for tasks.
Select Log out when you finish.
For a meaningful user-isolation check, create a task with one account, log out, register or log in with a second account, and confirm the first account's task is not visible to the second account.

7. API overview
The backend implementation includes these routes:

Method	Endpoint	Purpose
POST	/api/auth/register	Create a user account.
POST	/api/auth/login	Verify credentials and return an authentication token.
GET	/api/auth/me	Return the currently authenticated user's information.
GET	/api/tasks	Get tasks belonging to the authenticated user.
POST	/api/tasks	Create a task for the authenticated user.
PATCH	/api/tasks/:id	Update a task belonging to the authenticated user.
DELETE	/api/tasks/:id	Delete a task belonging to the authenticated user.
Protected task requests use this header:

Authorization: Bearer YOUR_TOKEN
The API details above describe the routes implemented in the current backend; they are not a substitute for running and testing each endpoint.

8. Data storage and security notes
This version uses local JSON files rather than a database server.
Keep server/tasks.json and server/users.json out of public version control if they contain real data.
Keep JWT_SECRET private. Anyone with the secret may be able to forge valid tokens.
The frontend stores the token in browser localStorage. This is convenient for a prototype, but production applications should carefully assess token storage and XSS risks.
JSON-file storage is suitable for a small local prototype, but it does not provide the transaction and concurrency guarantees expected from a production database.
Back up the JSON files before making changes or resetting local data.
9. Testing checklist
Run these checks manually before submitting the project:

Register a new account.
Log in with the correct password.
Confirm an incorrect password is rejected.
Create a task and confirm it appears.
Edit task details, status, and priority.
Delete a task.
Refresh the page and confirm task data persists.
Log out and log back in.
Confirm a second account cannot view or modify the first account's tasks.
Try a task API request without a token and confirm it is rejected.
Check that task timing updates when a task changes status.
Check the browser console and both terminals for errors.
Test status: This checklist is provided for verification. Do not report these checks as passing until they have actually been run. No automated test result is claimed by this README.

10. Current scope and possible future improvements
The current implementation is a working prototype. Depending on the final assignment rubric, useful future improvements may include:

Automated backend tests for authentication, task operations, and user isolation.
More robust storage using a database and transactions.
Input validation, rate limiting, and additional security hardening.
Email verification and password recovery, if required.
A review of SLA formulas against the exact intended definitions.
Clearer error messages and accessibility checks.
Deployment configuration and production environment setup.
11. GitHub safety checklist
Before pushing the project to GitHub, make sure that:

.env files and secret values are ignored.
node_modules/ and build output are ignored.
server/tasks.json and server/users.json are ignored if they contain local or personal data.
No passwords, access tokens, or personal user data are committed.
The setup instructions have been checked on a fresh local run.
Project: TaskFlow
Purpose: Task management, organization, and stage-time tracking
Status: Local prototype; verify the checklist and assignment rubric before submission.

