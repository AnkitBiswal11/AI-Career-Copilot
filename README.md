# 🚀 AI Career Copilot

### AI-Powered Career Intelligence Platform for Students & Job Seekers

> **Analyze your resume. Match your skills to target jobs. Identify skill gaps. Build a personalized career roadmap. Practice interviews. Get AI-powered career guidance — all in one platform.**

---

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.14+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-Frontend-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Ollama-Local%20AI-black?style=for-the-badge" alt="Ollama" />
  <img src="https://img.shields.io/badge/Qwen3-4B-7C3AED?style=for-the-badge" alt="Qwen3 4B" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/AI-Local%20Inference-blue?style=flat-square" alt="Local Inference" />
  <img src="https://img.shields.io/badge/API-REST-orange?style=flat-square" alt="REST API" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Problem](#-problem)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [System Architecture](#-system-architecture)
- [Application Modules](#-application-modules)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [AI Architecture](#-ai-architecture)
- [Database Architecture](#-database-architecture)
- [Security](#-security)
- [Project Highlights](#-project-highlights)
- [Future Roadmap](#-future-roadmap)
- [Git & Version Control](#-git--version-control)
- [Contributing](#-contributing)
- [License](#-license)
- [Developer](#-developer)

---

# 📌 Overview

**AI Career Copilot** is an AI-powered career intelligence platform designed to help students and job seekers understand their current skills, identify gaps against target roles, and create an actionable, personalized path toward career readiness.

Instead of using separate tools for:

- Resume analysis and scoring
- Job matching
- Skill-gap analysis
- Career planning
- Interview preparation
- AI career guidance

Career Copilot brings these workflows together into a single intelligent platform powered by **local AI inference**.

The platform transforms a user's resume and career target into structured insights, skill priorities, learning plans, interview preparation, and personalized career guidance.

---

# 🎯 Problem

Students and job seekers often face several challenges when preparing for industry roles.

### Common challenges

- **Uncertainty** — Not knowing how well their current resume aligns with industry expectations.
- **Ambiguity** — Job descriptions contain many requirements, making it difficult to determine what to prioritize.
- **Skill Gaps** — Users may know their target role but not understand which specific skills they are missing.
- **Disconnected Preparation** — Resume improvement, learning, job preparation, and interview practice are often handled separately.
- **Generic Advice** — Traditional career resources often provide broad recommendations instead of profile-specific guidance.
- **Lack of Direction** — Users may know they want a job but not know exactly what to learn or practice next.

This leads to a simple but important question:

> **"What exactly should I do next to become job-ready?"**

Career Copilot is designed to answer that question systematically.

---

# 💡 Solution

Career Copilot connects resume intelligence, target-role requirements, skill analysis, personalized roadmaps, interview preparation, and AI coaching into a continuous career-development workflow.

```text
Resume
   │
   ▼
AI Resume Analysis
   │
   ▼
Target Job
   │
   ▼
Job Match Analysis
   │
   ▼
Skill Gap Analysis
   │
   ▼
Personalized Career Roadmap
   │
   ├──────────────► Learning
   │
   ├──────────────► Interview Practice
   │
   ▼
AI Career Coach
   │
   ▼
Career Progress



✨ Key Features
1. 📄 Resume Intelligence
Upload your resume in PDF/text format. The system extracts competencies, scores completeness, and isolates strengths and weaknesses.

2. 💼 AI Job Match
Compare any target job description directly against your resume profile to compute a deterministic relevance and compatibility score.

┌──────────────────┐          ┌──────────────────┐
│      RESUME      │          │ JOB REQUIREMENTS │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         └──────────────┬──────────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ AI MATCH & INSIGHTS │
             └─────────────────────┘

3. 🧠 AI Skill Gap AnalyzerBenchmarks your verified skills against industry expectations for your target role.SkillCurrent LevelRequired LevelGapPriorityPython75%90%15%MediumSQL65%85%20%HighDocker20%75%55%HighFastAPI70%80%10%Low

4. 🗺️ Personalized Career RoadmapGenerates step-by-step milestones organized by priority skills, practical assignments, and completion tracking.

5. 🎤 AI Interview PreparationProvides dynamic technical and behavioral interview sessions tailored to your detected skill gaps, with line-by-line feedback and scoring.

6. 🤖 AI Career CoachAn interactive conversational assistant with full context over your resume, target role, and active learning roadmap.

7. 📊 Unified Dashboard & Learning HubA central interface displaying your readiness metric, skill distributions, active roadmap tasks, and prioritized learning resources.🔄 How It Works

┌───────────────────┐
│   Upload Resume   │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Resume AI Parsing │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  Target Role / JD │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Skill Gap Engine  │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Dynamic Roadmap   │
└─────────┬─────────┘
          │
     ┌────┴──────────────┐
     ▼                   ▼
┌──────────────┐   ┌──────────────┐
│ Learning Hub │   │  Mock Coach  │
└──────────────┘   └──────────────┘


🏗️ System Architecture

┌───────────────────────┐
                     │     User / Client     │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ React + TS (Vite)     │
                     │ Tailwind CSS, Lucide  │
                     └───────────┬───────────┘
                                 │
                            REST / JSON (JWT)
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │    FastAPI Backend    │
                     └───────────┬───────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  MySQL Database  │   │  Ollama Runtime  │   │  JWT Auth Engine │
│ (SQLAlchemy ORM) │   │   (Qwen3 4B)     │   │ (pwdlib hashing) │
└──────────────────┘   └──────────────────┘   └──────────────────┘

🧩 Application Modules
Career Copilot
├── 🔐 Authentication (Registration, Login, JWT verification)
├── 📄 Resume Intelligence (PDF Extraction, Skill Vectoring)
├── 💼 Job Matching (JD Parsing, Semantic Match Scoring)
├── 🧠 Skill Intelligence (Gap Benchmarking, Priority Levels)
├── 🗺️ Career Roadmaps (Stage & Item Tracking)
├── 🎤 Interview Engine (Dynamic Prompts, Answer Rubrics)
└── 🤖 Conversational Coach (Context-Aware Prompt Routing)


🛠️ Tech Stack

Frontend
• React — Frontend application library
• TypeScript — Type-safe client-side development
• Vite — Frontend tooling and development server
• Tailwind CSS — UI styling
• TanStack Router — Client-side routing
• Lucide React — UI icons
• Recharts — Data visualization

Backend
• Python — Backend programming language (3.14+)
• FastAPI — REST API framework
• SQLAlchemy — Database ORM
• Pydantic — Data validation
• JWT — Authentication
• pwdlib — Secure password hashing
• Uvicorn — High-performance ASGI server

Database
• MySQL — Relational database
• SQLAlchemy — ORM and database interaction
• PyMySQL — MySQL connectivity driver

AI & Local Inference
• Ollama — Local AI runtime
• Qwen3 4B — Local language model
• Structured JSON — AI-to-API integration

📁 Project Structure
career-copilot/
├── backend/
│   └── app/
│       ├── __init__.py
│       ├── main.py              # Application entrypoint & CORS
│       ├── auth.py              # JWT authentication logic
│       ├── database.py          # SQLAlchemy engine & session
│       ├── models.py            # Relational database models
│       ├── schemas.py           # Pydantic validation schemas
│       ├── ai_service.py        # Ollama interface & structured output
│       ├── coach_service.py     # Contextual coach logic
│       ├── interview_service.py # Interview generation & evaluation
│       ├── skill_gap_service.py # Benchmarking heuristics
│       └── routes/              # Modular API endpoints
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── routes/              # TanStack router page layouts
│   │   ├── services/            # Axios / fetch client configurations
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env.example
├── .gitignore
└── README.md

⚙️ Getting Started
Prerequisites
Python 3.14+

Node.js 20+ & npm

MySQL Server

Ollama installed and running

1. Clone & Setup Environment
git clone https://github.com/YOUR_USERNAME/career-copilot.git
cd career-copilot

Backend Setup:
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

Local LLM Setup:
ollama pull qwen3:4b
ollama run qwen3:4b

2. Database Configuration
Log in to MySQL and initialize the schema
CREATE DATABASE career_copilot;

Configure .env in the root folder:
DATABASE_URL=mysql+pymysql://USERNAME:PASSWORD@localhost:3306/career_copilot
SECRET_KEY=your_super_secret_jwt_key
OLLAMA_BASE_URL=http://localhost:11434


3. Run the Services
Start Backend:
python -m uvicorn backend.app.main:app --reload --port 8000

API Endpoint: [http://127.0.0.1:8000](http://127.0.0.1:8000)

Interactive Swagger Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

Start Frontend:
cd frontend
npm install
npm run dev

Client App: http://localhost:8080 (or http://localhost:5173)

📡 API Documentation
FastAPI auto-generates comprehensive interactive docs. With the server running, visit:

Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

🗄️ Database Architecture
User
 ├── Resumes (Parsed metadata, raw content, scores)
 ├── Job Descriptions (Requirements, title, tags)
 ├── Roadmaps
 │    └── Roadmap Stages
 │         └── Roadmap Items (Tasks, resources, completion states)
 └── Interview Sessions
      └── Interview Questions (Prompts, user submissions, AI critique)

📦 Git & Version Control
To prevent sensitive credentials and virtual environment binaries from entering version control, ensure your .gitignore contains:
# Python
__pycache__/
*.py[cod]
venv/
.venv/

# Environment secrets
.env
.env.*
!.env.example

# Frontend
node_modules/
dist/
build/

# OS & Logs
*.log
.DS_Store
Thumbs.db

🤝 Contributing
Fork the project repository.

Create your branch: git checkout -b feature/NewFeature

Commit your changes: git commit -m "Add NewFeature"

Push to origin: git push origin feature/NewFeature

Open a Pull Request.

📜 License
Distributed under the MIT License. See LICENSE for more information.

👨‍💻 Developer
Ankit

Computer Science & Engineering

Focus: Backend
