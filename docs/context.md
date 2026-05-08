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
- **Styling:** React Native StyleSheet, Playful 3D tactile UI (Duolingo-style) with solid bottom borders, vibrant colors, and physical push-down effects.
- **Scoring Engine:** Custom `scoring.ts` utility for score normalization, aggregation, and cognitive profiling

### Backend

- **Framework:** FastAPI
- **Language:** Python
- **ORM:** SQLAlchemy
- **Database:** PostgreSQL
- **AI Layer:** OpenClaw Agent (multi-model orchestration with OpenAI GPT, Anthropic Claude, Google Gemini for cognitive analysis and parent report generation)

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

### 4. AI Processing & Reporting (✅ Implemented)

- The backend aggregates all game sessions and behavioral patterns (accuracy, speed, levels) for a child.
- This data is fed into the **OpenClaw AI** orchestration layer, which uses multiple AI models with fallback:
  - **Primary:** OpenAI GPT-4 for cognitive reasoning
  - **Fallback:** Google Gemini for reasoning if OpenAI fails
  - **Report Generation:** Anthropic Claude for parent-friendly narrative reports
  - **Local Fallback:** Deterministic local logic if all AI providers fail
- The AI outputs a structured JSON report including strengths, weaknesses, parent recommendations, next game suggestion, difficulty adjustment, readiness level, and behavioral summary.
- Reports are automatically generated after each game session and stored in the database.
- The parent views the latest AI-generated report on the `/cognitive-profile` screen.

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

### DOMAIN_SCORES (Normalized Standings)

- Stores the **current best** score for each child per domain (Memory, Logic, etc.).
- One row per domain = No empty columns.

### COGNITIVE_HISTORY (Progress Tracker)

- Stores a **timeline** of every score update.
- Used to generate progress charts for parents.

### GAME_SESSIONS (Raw Data)

- `session_id` (PK)
- `child_id` (FK)
- `game_key`, `domain`, `score`, `accuracy`, `time_taken`, `level`, `stars`
- `played_at`

---

## 🤖 AI Integration (OpenClaw Pipeline)

### Architecture

- **Orchestration Layer:** `openClaw.py` coordinates AI models with graceful degradation
- **Reasoning Engine:** `reasoning_engine.py` (OpenAI GPT) analyzes cognitive patterns without recalculating scores
- **Report Generator:** `report_generator.py` (Anthropic Claude) creates parent-friendly narratives
- **Fallback System:** Local deterministic logic if AI providers fail

### Data Flow

1. Game session completes → Scores normalized deterministically
2. Cognitive profile built from aggregated sessions and domain scores
3. OpenClaw pipeline:
   - Attempts GPT reasoning → Falls back to Gemini → Falls back to local logic
   - Attempts Claude report generation → Falls back to local template
4. Report stored with provider metadata for transparency

### Configuration

- Environment variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- Model selection: `OPENAI_REASONING_MODEL`, `ANTHROPIC_REPORT_MODEL`, `GEMINI_FALLBACK_MODEL`
- Timeouts: Configurable per provider (default 12s)

### Behavioral Analysis

AI interprets patterns in:

- **Attention Consistency:** Sustained focus across game types
- **Impulsivity:** Speed vs accuracy trade-offs
- **Memory Retention:** Performance in memory-focused games over time
- **Processing Speed:** Time-based metrics normalized by difficulty

---

## 🧩 Frontend File Responsibilities

- **`app/index.tsx`**: Login entry point. Handles Quick Access profiles, manual login, and Google Auth.
- **`app/profile.tsx`**: Parent account creation.
- **`app/add-child.tsx`**: Form to create a new child profile under the parent. Navigates to cognitive profile on success.
- **`app/dashboard.tsx`**: Main hub. Handles the "Who's Playing?" child picker, displays the active child's score ring, domain progress, and vertical Journey Map of games. Includes options to Switch Child, Delete Child, or Delete Account.
- **`app/game-results.tsx`**: Post-game screen showing stars and score.
- **`app/cognitive-profile.tsx`**: Deep dive into the active child's stats (Radar chart, session history, AI button).
- **`app/games/*.tsx`**: The 10 individual games (including Story Builder and Color Mixer Lab). Each game reads the `selectedChild` on mount and passes it to the scoring engine when the round finishes.
- **`utils/scoring.ts`**: The brain of the frontend. Calculates 0-100 normalized scores based on weighted formulas (50% accuracy + 30% level + 20% speed). Handles all `AsyncStorage` reading/writing and backend Axios API calls to sync sessions.

---

## ⚙️ Development Workflows

### Running the Apps

- **One-Click Startup (Recommended):**
  - **Windows:** Run `startup.bat` from project root
  - **Linux/Mac:** Run `bash startup.sh` from project root
  - Handles backend migrations, process cleanup, and starts both services
- **Manual:**
  - **Frontend:** `cd frontend && npx expo start --clear` (clear cache recommended)
  - **Backend:** `cd backend && venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Database IP:** Frontend auto-detects backend URL from Expo dev server, falls back to `EXPO_PUBLIC_API_URL` in `frontend/.env`, then `http://127.0.0.1:8000`
- **Verification:** Test backend at `http://127.0.0.1:8000/` or your machine's IP

### Database Migrations

FastAPI and SQLAlchemy will automatically create _new_ tables when you start the server. However, if you **modify** an existing table (e.g., adding a new column), SQLAlchemy cannot alter it.
During early development, the fastest way to apply schema changes is to completely drop and recreate the tables by running:

```bash
cd backend
.\venv\Scripts\python.exe db_migrate.py
```

_(Note: This deletes all existing local data. For production, the team will need to implement `Alembic` for non-destructive migrations)._

### Seeding Games

To initialize or update the game list in the database, run the seeding script:

```bash
cd backend
.\venv\Scripts\python.exe add_games.py
```

This adds all 10 registered games (like Color Recall, Story Builder, etc.) to the `games` table.

### Dependencies

- **Backend:** Install with `pip install -r requirements.txt` (includes OpenAI, Anthropic, Google Generative AI clients)
- **Frontend:** Install with `npm install` in `frontend/` directory

---

## 👥 Team

- D Rohan Samuel
- Syed Mohammed Zuber
- Sharon Samuel Halli
- K Anushka Reddy

---

## 📝 Recent Changes (May 2026)

### AI Integration Implementation

- ✅ **OpenClaw Pipeline:** Multi-model AI orchestration with OpenAI GPT, Anthropic Claude, Google Gemini
- ✅ **Automatic Report Generation:** AI insights generated after every game session
- ✅ **Fallback System:** Graceful degradation to local logic if AI providers fail
- ✅ **Enhanced Reports:** Added readiness labels, behavioral summaries, provider metadata

### Backend Improvements

- ✅ **New Models:** CognitiveScore for legacy compatibility, expanded Report schema
- ✅ **Report Service:** Dedicated service for cognitive profile building and AI report generation
- ✅ **Score Normalization:** Deterministic 0-100 scoring with legacy table sync
- ✅ **API Endpoints:** New `/report/generate` and `/reports/generate/{child_id}` endpoints

### Frontend Enhancements

- ✅ **Cognitive Profile Updates:** Handle new report fields, improved error handling
- ✅ **API Client Improvements:** Auto-detection of backend URL from Expo dev server
- ✅ **Bug Fixes:** Fixed Story Builder card tap logic
- ✅ **UI Polish:** Better handling of list fields in reports

### Development Experience

- ✅ **Startup Scripts:** Improved `startup.bat` and `startup.sh` with error handling and process cleanup
- ✅ **Dependencies:** Added AI client libraries (openai, anthropic, google-generativeai)
- ✅ **Environment Config:** Updated `.env.example` with new AI API keys
- ✅ **Documentation:** Enhanced README with verification steps and startup instructions
