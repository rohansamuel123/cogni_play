# IntelliSight

### AI-Powered Cognitive Assessment Platform for Children

---

## 🎯 The Problem

Traditional cognitive testing for children is often rigid, intimidating, and limited to a single "snapshot" in time. Standard IQ tests focus heavily on *what* a child answers correctly, rather than *how* they think. This approach can cause unnecessary stress and fails to provide parents with actionable insights into their child's unique cognitive strengths, such as focus, memory retention, or processing speed. Parents are often left with cold numbers and diagnostic labels, but no real understanding of their child's learning patterns.

## 💡 The Solution

**IntelliSight** transforms cognitive assessment into a series of gamified, 3D-tactile challenges that children actually enjoy. Instead of static questions, we use behavior-based assessment.

As the child plays games like "Color Recall" or "Story Builder," our engine measures behavioral metrics in real-time. We track visual memory, logical sequencing, attention consistency, and impulsivity.

This data is then processed by the **OpenClaw AI Orchestration Layer**—a multi-model pipeline utilizing OpenAI GPT, Anthropic Claude, and Google Gemini—to generate warm, supportive, and parent-friendly narratives. IntelliSight provides actionable recommendations without clinical jargon, turning testing into a continuous journey of discovery.

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (SQLAlchemy)
- **AI Engine:** OpenClaw Agent

---

## 🚀 Setup & Instructions

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v18+)
- **Python** (3.10+)
- **PostgreSQL** (Running locally)
- **Expo Go** app installed on your physical mobile device

### Configuration
1. Clone the repository to your local machine.
2. Set up your database credentials and AI API keys.
3. In the `backend` directory, create a `.env` file:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/intellisight_db
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GEMINI_API_KEY=your_gemini_key
   ```
4. In the `frontend` directory, create a `.env` file with your machine's IP address:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
   ```

---

## 💻 How to Run IntelliSight

We provide two ways to run the project: an automated one-click startup and a manual method.

### Method 1: One-Click Startup (Recommended)
This method automatically handles database migrations, process cleanup, and starts both the frontend and backend servers. Run these from the **repository root**:

**Windows (CMD / PowerShell):**
```cmd
startup.bat
```

**Linux / Mac (Git Bash):**
```bash
bash startup.sh
```

To stop the services, you can run `stop.bat` (Windows) or `bash stop.sh` (Linux/Mac).

### Method 2: Manual Startup

**1. Start the Backend:**
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Sync Database Schema (Drops and recreates tables)
python db_migrate.py

# Run the FastApi server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Verify the backend is running by opening `http://127.0.0.1:8000/` in your browser.*

**2. Start the Frontend:**
Open a new terminal window:
```bash
cd frontend
npm install

# Run Expo with a clean cache
npx expo start --clear
```

---

## 📱 Usage

1. **Connect:** Once the Expo server is running, open the **Expo Go** app on your phone.
2. **Scan:** Scan the QR code displayed in your terminal. Ensure your phone and computer are on the same Wi-Fi network.
3. **Register:** Create a Parent account on the startup screen.
4. **Add a Child:** Create a profile for your child.
5. **Play:** Hand the device to your child to play the unlocked games from the Dashboard.
6. **Review Insights:** After gameplay, navigate to the Cognitive Profile section to view the AI-generated behavioral report and cognitive radar chart.

---

## 👥 Team
- D Rohan Samuel
- Syed Mohammed Zuber
- Sharon Samuel Halli
- K Anushka Reddy
