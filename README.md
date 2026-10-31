# Secure Note-Taking Application — Backend REST API

This is the backend service for the Secure Note-Taking & Community Platform, built with **Node.js, Express, TypeScript, and MongoDB (Mongoose ODM)** with JWT authentication, RBAC, visible database indexing via `schema.index()`, and MongoDB aggregation pipelines.

---

## 🌐 Live Deployed Server

- **Live URL**: [https://noteflow-backend-5l9o.onrender.com/](https://noteflow-backend-5l9o.onrender.com/)
- **API Base**: [https://noteflow-backend-5l9o.onrender.com/api](https://noteflow-backend-5l9o.onrender.com/api)
- **Health Check**: `GET https://noteflow-backend-5l9o.onrender.com/` → `Server running successfully!`
- **Hosting Platform**: Render Cloud Web Service (Free Tier)

---

## 🔐 Roles & Permissions

- **User**:
  - Register, Login, update own profile & interests array.
  - Create, view, update, and delete their own notes.
  - View paginated list of their own notes.
  - Publish and view community posts.
- **Admin**:
  - Inherits all User capabilities.
  - Manages users (create, update status/role, list all, delete).
  - Can view everyone's notes across the entire platform.
  - Can view the unified table of all users' public and private posts.

---

## ⚡ Database Indexing Strategy

In compliance with indexing requirements, all indexes are explicitly defined via `schema.index()` in the model files so they are immediately visible during code review. **No unnecessary indexes are created.**

### User Schema (`src/app/modules/user/user.model.ts`)
- `userSchema.index({ email: 1 }, { unique: true })` — Speeds up authentication and duplicate email checks.
- `userSchema.index({ createdAt: -1 })` — Optimizes admin user listing sorted by newest.
- `userSchema.index({ interests: 1 })` — Multikey index that supports Scenario 1 aggregation matching.

### Note Schema (`src/app/modules/note/note.model.ts`)
- `noteSchema.index({ userId: 1, createdAt: -1 })` — Compound index following the ESR rule for user note list pagination and count queries.
- `noteSchema.index({ type: 1, createdAt: -1 })` — Supports filtering notes by visibility (`personal` vs `community`).
- `noteSchema.index({ createdAt: -1 })` — Supports admin viewing all users' notes sorted by creation date.

### Post Schema (`src/app/modules/post/post.model.ts`)
- `postSchema.index({ userId: 1, createdAt: -1 })` — Supports Scenario 2 `$lookup` pipeline joining on `userId` and sorting by `createdAt`.
- `postSchema.index({ interest: 1, createdAt: -1 })` — Supports interest-based filtering.
- `postSchema.index({ createdAt: -1 })` — Supports public post feed pagination.

---

## 📊 Aggregation Scenarios

### Scenario 1: Group by Interests (`src/app/modules/user/user.services.ts`)
- **Requirement**: Group users by interests using **exactly one `collection.aggregate()` call**.
- **Implementation**:
  - Uses `UserModel.aggregate([...])` with `$match` (utilizing the `{ interests: 1 }` index), `$unwind`, `$group`, `$sort`, and `$facet` for integrated pagination metadata and data in a single call.

### Scenario 2: User Posts ($lookup) (`src/app/modules/post/post.services.ts`)
- **Requirement**: Retrieve all posts belonging to a particular user using a **single aggregation pipeline with a `$lookup` stage**.
- **Implementation**:
  - Matches the user by `_id` using the built-in `{ _id: 1 }` index.
  - Runs `$lookup` to join the `posts` collection on `foreignField: "userId"` sorted by `{ createdAt: -1 }` (leveraging the `{ userId: 1, createdAt: -1 }` compound index).

---

## 🚀 Setup & Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env
# Configure your MongoDB URI and JWT secrets in .env

# 3. Start development server
npm run dev

# 4. Build and run production
npm run build
npm start
```

Default server port: `http://localhost:5000`

