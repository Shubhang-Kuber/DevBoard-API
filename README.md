# DevBoard API

A REST API for developers to manage tasks and bookmarks, with tag-based organization across both. Built from scratch with Node.js, Express, and SQLite to learn REST API design, authentication, and relational database modeling in depth.

## Why this project

I built DevBoard to deeply understand how a real backend works end to end — not just calling APIs, but designing and implementing one: HTTP methods and status codes, middleware chains, JWT authentication, password hashing, and many-to-many relationships in a relational database.

## Features

- **JWT authentication** — register, login, and protected routes using bcrypt password hashing and signed tokens
- **Tasks CRUD** — create, read, update, and delete tasks, scoped per user
- **Bookmarks CRUD** — save and organize developer links and docs, scoped per user
- **Tags** — shared labels that attach to both tasks and bookmarks via a many-to-many relationship
- **Ownership enforcement** — every query is scoped to the authenticated user, so users can only ever access their own data
- **Centralized error handling** — consistent JSON error responses and a global error-handling middleware

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | SQLite (via the `sqlite` + `sqlite3` packages) |
| Auth | JSON Web Tokens (`jsonwebtoken`) + `bcrypt` for password hashing |
| Config | `dotenv` for environment variables |
| Dev tooling | `nodemon` for auto-reload |

## Project structure

```
devboard-api/
├── controllers/        # Business logic — reads req, talks to the DB, builds the response
│   ├── authController.js
│   ├── tasksController.js
│   ├── bookmarksController.js
│   └── tagsController.js
├── routes/              # URL → controller mapping, one file per resource
│   ├── auth.js
│   ├── tasks.js
│   ├── bookmarks.js
│   └── tags.js
├── middleware/
│   └── auth.js          # JWT verification — protects routes
├── db/
│   ├── index.js         # Database connection + schema bootstrap
│   └── schema.sql        # Table definitions
├── app.js                # Express app config — middleware, routes, error handling
├── server.js              # Entry point — starts the DB connection, then the server
├── requests.http           # Example requests for every endpoint (use with the REST Client VS Code extension)
└── .env.example              # Template for required environment variables
```

## Database schema

Four tables: `users`, `tasks`, `bookmarks`, and `tags`. Tasks and bookmarks each belong to one user via a foreign key. Tags connect to tasks and bookmarks through two junction tables (`task_tags` and `bookmark_tags`), since one tag can apply to many items and one item can have many tags.

```
users ──< tasks ──< task_tags >── tags
  └────< bookmarks ──< bookmark_tags >── tags
```

## Getting started

### Prerequisites
- Node.js (v18 or later recommended)
- npm

### Installation

```bash
git clone https://github.com/Shubhang-Kuber/DevBoard-API.git
cd DevBoard-API
npm install
```

### Environment setup

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output into `JWT_SECRET` in your `.env` file.

### Running the server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`. The SQLite database and all tables are created automatically on first run.

### Testing the API

Open `requests.http` in VS Code with the [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) installed, and click "Send Request" above any endpoint. It includes working examples for every route in the API.

## API reference

### Auth

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| POST | `/auth/register` | Create a new user account | No |
| POST | `/auth/login` | Log in and receive a JWT | No |
| GET | `/auth/me` | Get the current logged-in user's profile | Yes |

### Tasks

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | `/tasks` | List all of the current user's tasks | Yes |
| GET | `/tasks/:id` | Get a single task | Yes |
| POST | `/tasks` | Create a new task | Yes |
| PATCH | `/tasks/:id` | Update a task (partial update) | Yes |
| DELETE | `/tasks/:id` | Delete a task | Yes |
| POST | `/tasks/:id/tags` | Attach a tag to a task | Yes |

### Bookmarks

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | `/bookmarks` | List all of the current user's bookmarks | Yes |
| GET | `/bookmarks/:id` | Get a single bookmark | Yes |
| POST | `/bookmarks` | Create a new bookmark | Yes |
| PATCH | `/bookmarks/:id` | Update a bookmark (partial update) | Yes |
| DELETE | `/bookmarks/:id` | Delete a bookmark | Yes |

### Tags

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | `/tags` | List all tags | Yes |
| POST | `/tags` | Create a new tag | Yes |
| DELETE | `/tags/:id` | Delete a tag | Yes |
| GET | `/tags/:id/items` | Get all tasks and bookmarks with this tag | Yes |

## Authentication

Protected routes require a JWT in the `Authorization` header:

```
Authorization: Bearer <your_token_here>
```

Tokens are issued on login and expire after 7 days. All protected routes verify the token via middleware before the request reaches any controller logic, and every database query is scoped to the authenticated user's ID — so one user can never read or modify another user's data.

## What I learned building this

- How HTTP request/response cycles actually work — headers, status codes, and body parsing
- The difference between PATCH (partial update) and PUT (full replace), and why PATCH fits this use case
- How JWT authentication works under the hood — signing, verification, and stateless session management
- Why password hashing is one-way, and how `bcrypt.compare` verifies a password without ever reversing the hash
- How to model and query a many-to-many relationship using a junction table
- The importance of scoping every database query to the authenticated user — this is the single most common real-world API security flaw (broken object-level authorization)

## License

MIT