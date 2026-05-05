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
- **State/Storage:** `@react-native-async-storage/async-storage` for local sessions and profiles
- **API Client:** Axios for API calls
- **Styling:** React Native StyleSheet, gamified UI theme (warm creams, vibrant orange, 3D pill shapes)

### Backend

- **Framework:** FastAPI
- **Language:** Python
- **ORM:** SQLAlchemy

### Database (Planned/Initial Setup)

- PostgreSQL

### AI Layer

- OpenClaw Agent (analysis + report generation)

---

## 📁 Project Structure

### Root

```bash
intellisight/
├── frontend/    # React Native Expo app
├── backend/     # FastAPI Python server
├── docs/        # Project documentation and context
```

---

### Frontend Structure (Expo Router)

The frontend is built using a file-based routing system where each file in `app/` is a screen.

```bash
frontend/
├── app/
│   ├── _layout.tsx         # Root layout configuration (controls header visibility)
│   ├── index.tsx           # Home/Login screen (Quick Access & Manual Login)
│   ├── profile.tsx         # Parent account creation
│   ├── dashboard.tsx       # Landing page after successful login
│   ├── game.tsx            # (Planned) Game screen
│   ├── report.tsx          # (Planned) AI report
│
├── components/             # Reusable UI
│   └── Button.tsx          # Custom 3D gamified button component
│
├── assets/                 # Images, fonts, etc.
│   └── mascot.png          # Mascot image
│
├── services/               # API connection logic
│   └── api.js              # Axios config
│
├── hooks/                  # Custom logic
├── constants/              # Config values
```

#### 🧩 Frontend File Responsibilities:
- **`app/index.tsx`**: The main entry point. It checks for a persistent login session on mount. If logged in, redirects to `/dashboard`. If not, it reads saved profiles from `AsyncStorage` and displays large "Quick Login" avatars. It also handles manual email/password login.
- **`app/profile.tsx`**: Allows users to create a parent account (Name, Email, Password). Upon creation, the account is stored locally via `AsyncStorage` inside an `accounts` array, and the user is instantly logged in (saving to `currentUser` key) and routed to `/dashboard`.
- **`app/dashboard.tsx`**: The landing screen for parents. It reads the `currentUser` from `AsyncStorage` to display a personalized greeting. Includes a "Logout" mechanism that clears the session and routes back to `/`.
- **`components/Button.tsx`**: A reusable, highly stylized React Native `<Pressable>` component that gives buttons a tactile, 3D pill-shaped feel suitable for a gamified, child-friendly app.

---

### Backend Structure

```bash
backend/
├── app/
│   ├── main.py             # Entry point (FastAPI server)
│   ├── routes/
│   │   ├── user.py
│   │   ├── game.py
│   │   ├── session.py
│   │   ├── report.py
│   │
│   ├── models/             # SQLAlchemy ORM Models
│   │   ├── user.py
│   │   ├── game.py
│   │   ├── session.py
│   │   ├── report.py
│   │   ├── score.py
│   │
│   ├── schemas/            # Pydantic validation models
│   ├── services/
│   │   ├── scoring_service.py
│   │   ├── ai_service.py
│   │
│   ├── db/
│   │   └── database.py     # Database connection setup
```

---

## 🔄 System Flow (End-to-End)

### 1. Account & Session Flow
- **App Launch:** `index.tsx` checks `AsyncStorage` for `currentUser`. 
- **If authenticated:** Immediately route to `dashboard.tsx`.
- **If unauthenticated:**
  - Display "Quick Access" profiles (loaded from `accounts` array in `AsyncStorage`).
  - User taps Quick Access -> logs in instantly.
  - OR User logs in manually with Email/Password.
  - OR User taps "Create Profile" -> navigates to `profile.tsx` -> saves new account to `AsyncStorage` -> logs in.

### 2. Gameplay Interaction (Planned)
- Child plays game in mobile app

### 3. Data Capture (Planned)
Frontend sends:
```json
{
  "user_id": "uuid",
  "game_id": "memory_01",
  "actions": [...],
  "time_taken": 12.5,
  "accuracy": 80
}
```

### 4. Backend Processing
- Store raw session in DB
- Compute basic metrics

### 5. Cognitive Scoring
Derived metrics:
- memory_score
- attention_score
- logic_score
- comprehension_score
- processing_speed

### 6. AI Processing (OpenClaw)
Input:
- aggregated scores
- gameplay history
Output:
- strengths, weaknesses, recommendations, readiness level

### 7. Output
- Dashboard updated
- Report displayed

---

## 🗄️ Database Schema (Final Plan)

### USERS
- id (PK)
- name
- age
- email
- created_at

### GAMES
- id (PK)
- name
- type (memory, logic, attention)
- difficulty_level
- description

### GAME_SESSIONS
- id (PK)
- user_id (FK)
- game_id (FK)
- score
- accuracy
- time_taken (integer seconds)
- actions (JSONB)
- played_at

### COGNITIVE_SCORES
- id (PK)
- user_id (FK)
- memory_score
- attention_score
- logic_score
- comprehension_score
- processing_speed_score
- updated_at

### REPORTS
- id (PK)
- user_id (FK)
- summary
- strengths
- weaknesses
- recommendations
- readiness_level
- created_at

---

## 🔌 API Design (Planned)

### User
- POST /users → create user
- GET /users → list users

### Game
- GET /games → fetch available games

### Session
- POST /session → submit gameplay

### Report
- GET /report/{user_id} → fetch AI report

---

## ⚙️ Current Implementation Status

### ✅ Done

- Idea finalized
- Wireframes created
- DFD created
- DB schema designed
- Backend initialized
- Basic FastAPI running
- Frontend initialized (Expo Router)
- **Database models fully implemented with SQLAlchemy ORM**
- **All model relationships fixed and validated**
- **Backend environment configuration (load_dotenv)**
- **PostgreSQL driver (psycopg2) installed and configured**
- **Frontend local session management (AsyncStorage) implemented**
- **Frontend profile creation flow built**
- **Frontend 'Quick Access' authentication built**
- **Frontend global gamified UI established (creams, warm oranges, 3D buttons)**

### 🚧 In Progress

- API structuring
- First real endpoints
- Connecting frontend local accounts with backend Postgres accounts

### ❌ Not Started

- Game logic
- AI integration
- Backend score computation algorithms

---

## ⚠️ Networking Setup (IMPORTANT)

- Use Expo Tunnel OR same WiFi
- Backend must run with:
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000
  ```
- API baseURL:
  - localhost for web
  - IPv4 for mobile

---

## 🧠 AI Integration Plan

### Role of AI
- NOT real-time gameplay
- ONLY post-analysis

### Input to AI
- Cognitive scores
- Session history

### Output
Structured JSON:
```json
{
  "strengths": "...",
  "weaknesses": "...",
  "recommendations": "...",
  "readiness_level": "..."
}
```

---

## 🧩 Game Design Approach

Games should:
- Be simple and visual
- Require minimal reading
- Capture interaction patterns

Examples:
- Memory sequence
- Pattern matching
- Follow instructions

---

## 🎯 Design Constraints

- UI must be child-friendly (warm colors, playful 3D buttons, large touch targets)
- Backend must remain simple
- AI should enhance, not complicate
- Avoid over-engineering

---

## 🧾 Usage for AI Tools

This file contains:
- Full architecture
- Data flow
- File responsibilities
- Database schemas

👉 **To any AI Assistant:** Read this entire document before generating code or making architectural decisions. It is the definitive source of truth for the IntelliSight project.

---

## 👥 Team

- D Rohan Samuel
- Syed Mohammed Zuber
- Sharon Samuel Halli
- K Anushka Reddy

---

## 🚀 Final Vision

Create a platform where:
> “Every child is understood based on how they think, not judged by a single number.”
