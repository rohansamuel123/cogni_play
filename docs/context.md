# 🧠 IntelliSight — Full Project Context (AI-Ready)

---

## 📌 Project Identity

**Name:** IntelliSight
**Type:** AI-powered cognitive assessment platform for children
**Platform:** Mobile-first (React Native)
**Goal:** Replace rigid IQ-based evaluation with **behavior-based cognitive assessment**

---

## 🎯 Core Idea (VERY IMPORTANT)

Instead of testing children with static IQ questions:
👉 We observe **how they interact with tasks**
We measure:
- Memory
- Attention
- Logic
- Comprehension
- Processing Speed

👉 Then use AI to interpret these behaviors into a **cognitive profile**

---

## 🧠 Key Principle

> “Measure thinking patterns, not just answers.”

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** React Native (Expo)
- **Routing:** Expo Router (file-based routing)
- **State/Storage:** `@react-native-async-storage/async-storage` for local caching of child data and auth tokens.
- **API Client:** Axios for API calls (base URL from `.env` via `EXPO_PUBLIC_API_URL` with JWT interceptors)
- **Styling:** React Native StyleSheet, gamified UI theme (warm creams, vibrant orange, 3D pill shapes)
- **Scoring Engine:** Custom `scoring.ts` utility for score normalization, aggregation, and cognitive profiling

### Backend
- **Framework:** FastAPI
- **Language:** Python
- **ORM:** SQLAlchemy
- **Database:** PostgreSQL
- **AI Layer (Planned):** OpenClaw Agent (analysis + report generation)

---

## 🔄 System Data Flow (End-to-End)

The platform is designed around a **Parent -> Child -> Gameplay** hierarchy.

### 1. Authentication & Parent Session
- **Action:** A parent registers or logs in via `/users/register` or `/users/login` (or Google Auth).
- **Storage:** The backend returns a JWT access token. The frontend saves this token in `AsyncStorage` and attaches it via Axios interceptors to all subsequent API requests. The parent's details are stored locally as `currentUser`.

### 2. Child Selection & Dashboard
- **Action:** Upon entering the Dashboard, the frontend hits `GET /children/`.
- **Flow:** 
  - If no children exist, the parent is prompted to add one.
  - If children exist, a "Who's Playing?" screen appears. The parent selects a child.
  - The selected child is saved to `AsyncStorage` as `selectedChild`.
  - The frontend hits `GET /sessions/child/{child_id}` to download all historical gameplay data for that specific child from PostgreSQL, hydrating the local device storage.
- **Result:** The Dashboard updates to show the specific cognitive scores, domain bars, and unlocked games for the **selected child only**.

### 3. Gameplay Loop
- **Action:** The child plays a game (e.g., Color Recall).
- **Flow:**
  - The game records raw metrics: `score` (e.g., 5/7 matches), `accuracy`, `timeTaken` (seconds), and highest `level` reached.
  - Upon completion, the game calls `saveGameSession(childId, data)`.
  - The `scoring.ts` engine normalizes these metrics into a 0-100 score and calculates a 1-3 star rating.
  - The session is saved to local `AsyncStorage` (scoped by child ID) for instant UI updates.
  - The session is asynchronously `POST`ed to `/sessions/child/{child_id}` to persist in the PostgreSQL database.
- **Result:** The child sees the `game-results` screen with their stars, and returning to the Dashboard reflects their new scores.

### 4. AI Processing & Reporting (Planned)
- Periodically, or upon parent request, the backend aggregates all game sessions for a child.
- This aggregated cognitive profile is fed into an LLM (OpenClaw).
- The LLM outputs a structured JSON report (strengths, weaknesses, recommendations).
- The parent views this generated report on the `/cognitive-profile` screen.

---

## 🗄️ Database Schema

### USERS (Parents)
- `user_id` (PK)
- `name`, `email`, `password`
- `created_at`

### CHILDREN
- `child_id` (PK)
- `parent_id` (FK to USERS)
- `name`, `age`, `gender`, `avatar`
- `created_at`

### GAME_SESSIONS
- `session_id` (PK)
- `child_id` (FK to CHILDREN, ON DELETE CASCADE)
- `user_id` (FK to USERS)
- `game_key` (String, e.g., "color-recall")
- `domain` (String, e.g., "memory")
- `score`, `max_score`, `accuracy`, `time_taken`, `level`, `stars`
- `played_at`

---

## 🧩 Frontend File Responsibilities

- **`app/index.tsx`**: Login entry point. Handles Quick Access profiles, manual login, and Google Auth.
- **`app/profile.tsx`**: Parent account creation.
- **`app/add-child.tsx`**: Form to create a new child profile under the parent. Navigates to cognitive profile on success.
- **`app/dashboard.tsx`**: Main hub. Handles the "Who's Playing?" child picker, displays the active child's score ring, domain progress, and vertical Journey Map of games. Includes options to Switch Child, Delete Child, or Delete Account.
- **`app/game-results.tsx`**: Post-game screen showing stars and score.
- **`app/cognitive-profile.tsx`**: Deep dive into the active child's stats (Radar chart, session history, AI button).
- **`app/games/*.tsx`**: The 8 individual games. Each game reads the `selectedChild` on mount and passes it to the scoring engine when the round finishes.
- **`utils/scoring.ts`**: The brain of the frontend. Calculates 0-100 normalized scores based on weighted formulas (50% accuracy + 30% level + 20% speed). Handles all `AsyncStorage` reading/writing and backend Axios API calls to sync sessions.

---

## ⚙️ Development Workflows

### Running the Apps
- **Frontend:** `cd frontend && npx expo start`
- **Backend:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Database IP:** The frontend points to the backend via `EXPO_PUBLIC_API_URL` in `frontend/.env`. This must be your machine's Wi-Fi IPv4 address so your physical phone can connect to the server.

### Database Migrations
FastAPI and SQLAlchemy will automatically create *new* tables when you start the server. However, if you **modify** an existing table (e.g., adding a new column), SQLAlchemy cannot alter it.
During early development, the fastest way to apply schema changes is to completely drop and recreate the tables by running:
```bash
cd backend
.\venv\Scripts\python.exe db_migrate.py
```
*(Note: This deletes all existing local data. For production, the team will need to implement `Alembic` for non-destructive migrations).*

---

## 👥 Team
- D Rohan Samuel
- Syed Mohammed Zuber
- Sharon Samuel Halli
- K Anushka Reddy
