# 🧠 IntelliSight

### AI-Powered Cognitive Development Platform for Early Learners

---

## 🚀 Overview

IntelliSight is a gamified mobile application designed to assess and enhance cognitive abilities in young children through interactive activities and AI-driven insights.

Instead of relying solely on traditional IQ tests, IntelliSight evaluates children based on real-time performance in engaging tasks, offering a more holistic and development-focused understanding of their learning potential.

---

## 🎯 Problem Statement

Early childhood assessments are often:

* Rigid and standardized
* Not adaptive to individual learning pace
* Focused on IQ rather than real cognitive skills

This leads to:

* Misjudgment of a child’s abilities
* Increased stress for children and parents
* Early and inaccurate labeling

---

## 💡 Solution

IntelliSight provides:

* 🎮 Gamified cognitive assessments
* 📊 Skill-based evaluation (memory, attention, logic, comprehension)
* 🤖 AI-generated reports using OpenClaw
* 📈 Continuous progress tracking

---

## 🧩 Key Features

* 🕹️ Interactive games for cognitive evaluation
* 📊 Real-time performance tracking
* 🤖 AI-powered cognitive reports
* 📈 Skill-wise progress dashboard
* 👨‍👩‍👧 Parent-friendly insights

---

## 🏗️ Tech Stack

**Frontend:** React Native (Expo)
**Backend:** FastAPI
**Database:** PostgreSQL
**AI Engine:** OpenClaw Agent

---

## 🧠 System Architecture

```id="f7p2s1"
Mobile App (React Native)
        ↓
FastAPI Backend
        ↓
PostgreSQL Database
        ↓
OpenClaw AI Agent
        ↓
AI Reports → App
```

---

## 🔄 Data Flow

1. User plays a game on the mobile app
2. Game interaction data is sent to the backend
3. Backend stores session data in PostgreSQL
4. Cognitive scores are calculated
5. Data is sent to OpenClaw AI
6. AI generates a cognitive report
7. Results are displayed in the app

---

## 🗄️ Database Design

* **Users** – child profiles
* **Games** – cognitive tasks
* **Game Sessions** – gameplay data
* **Cognitive Scores** – processed skill metrics
* **Reports** – AI-generated insights

---

## 📱 App Flow

```id="6ak9pd"
Welcome → Profile Setup → Game Selection → Game → Result → Dashboard → AI Report
```

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```id="z9m1tq"
git clone https://github.com/your-repo/intellisight.git
cd intellisight
```

---

### 2. Backend Setup (FastAPI)

```id="v91d2f"
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  (Mac/Linux)

pip install -r requirements.txt
uvicorn main:app --reload
```

---

### 3. Frontend Setup (React Native)

```id="4s2lqp"
cd frontend
npm install
npx expo start
```

---

## 🔮 Future Enhancements

* 🎯 Adaptive difficulty using AI
* 🧠 Personalized learning paths
* 🏫 School integration dashboard
* ☁️ Cloud deployment

---

## 📌 Notes

This project is developed as part of a hackathon to provide a more inclusive and practical approach to early cognitive assessment and development.

---

## ⭐ Acknowledgements

* OpenClaw AI
* FastAPI
* React Native

---
