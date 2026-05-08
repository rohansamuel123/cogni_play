# IntelliSight

### AI-Powered Cognitive Development Platform for Early Learners

---

## Today's Core Updates (May 7-8)
We have made significant architectural upgrades to the platform:
- **OpenClaw AI Integration**: Automated behavioral analysis that provides personalized strengths, weaknesses, and recommendations for every child.
- **Progress Tracking**: Implemented a cognitive_history system to track growth over time (ready for charting).
- **Normalized Scoring**: Refactored the database to a "One Row Per Domain" structure—eliminating empty columns and making the system infinitely scalable.
- **Smart Synchronization**: Automatic backend recalculation of cognitive profiles every time a game is finished.

---

## How to Run IntelliSight Locally

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **PostgreSQL** (Running locally)
- **Expo Go** app on your physical phone (for mobile testing)

### 2. Backend Setup (FastAPI)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your DB credentials and OpenClaw key
# DATABASE_URL=postgresql://user:pass@localhost:5432/intellisight_db
# OPENCLAW_API_KEY=your_key_here

# IMPORTANT: Sync Database Schema (This will drop and recreate tables)
python db_migrate.py

# Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify the backend before opening the app:
- On the computer: open `http://127.0.0.1:8000/`
- On your phone: open `http://<computer-ip>:8000/`

### 3. Frontend Setup (React Native)
```bash
cd frontend

# Install dependencies
npm install

# Create .env file and set your COMPUTER'S IP ADDRESS
# EXPO_PUBLIC_API_URL=http://192.168.x.x:8000

# Run Expo with a clean cache
npx expo start --clear
```

Restart Expo after changing `frontend/.env`; Expo only reads `EXPO_PUBLIC_*` values when the dev server starts.

If `EXPO_PUBLIC_API_URL` is missing, the app will try to derive the backend host from Expo's dev server URL, then fall back to `http://127.0.0.1:8000` for local/web testing.

### 4. One-Click Startup
Run these from the repository root, not from `frontend/` or `backend/`:

**Git Bash:**
```bash
bash startup.sh
```

**CMD / PowerShell:**
```cmd
startup.bat
```

### 5. Stopping the Project
If you used the startup scripts, you can stop everything with:

**Git Bash (Recommended):**
```bash
bash stop.sh
```

**CMD / PowerShell:**
```cmd
stop.bat
```

---
*Note: If you are using CMD or PowerShell, you can also run `startup.bat` to start the project.*

*Note: Open the Expo Go app on your phone and scan the QR code. Ensure your phone and laptop are on the same Wi-Fi.*

---

## 🏗️ Tech Stack
- **Frontend:** React Native (Expo)
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (SQLAlchemy)
- **AI Engine:** OpenClaw Agent

---

## 🗄️ Database Design (Latest)
- **users** – Parent accounts & Auth
- **children** – Individual child profiles
- **domain_scores** – Current best normalized scores per domain
- **cognitive_history** – Chronological log of all gameplay progress
- **game_sessions** – Raw interaction data from games
- **reports** – AI-generated behavioral analysis

---

## 👥 Team
- D Rohan Samuel
- Syed Mohammed Zuber
- Sharon Samuel Halli
- K Anushka Reddy
