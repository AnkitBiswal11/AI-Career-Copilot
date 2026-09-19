from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models

from .routes import router
from .resume_routes import router as resume_router
from .job_routes import router as job_router
from .dashboard_routes import router as dashboard_router
from .interview_routes import router as interview_router
from .skill_gap_routes import router as skill_gap_router
from .roadmap_routes import router as roadmap_router
from .coach_routes import router as coach_router


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Career Copilot",
    description="AI-powered career guidance and placement preparation platform",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

# Allow the Lovable / Vite frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTES
# =========================================================

# Authentication / users
app.include_router(router)

# Resume upload + AI resume analysis
app.include_router(resume_router)

# Job creation + resume/job matching
app.include_router(job_router)

# Dashboard
app.include_router(dashboard_router)

# AI Interview Coach
app.include_router(interview_router)

# Skill Gap Analysis
app.include_router(skill_gap_router)

# Personalized Career Roadmap
app.include_router(roadmap_router)

# AI Career Coach
app.include_router(coach_router)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Career Copilot API is running"
    }