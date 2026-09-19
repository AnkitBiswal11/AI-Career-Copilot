import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .database import SessionLocal
from .dependencies import get_current_user
from .models import Resume, JobDescription, User

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get all resumes belonging to the logged-in user
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.id.desc())
        .all()
    )

    # Get all jobs belonging to the logged-in user
    jobs = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.id.desc())
        .all()
    )

    # Latest resume is the first one because of descending ID
    latest_resume = resumes[0] if resumes else None

    latest_analysis = None

    if latest_resume and latest_resume.analysis:
        try:
            latest_analysis = json.loads(
                latest_resume.analysis
            )
        except json.JSONDecodeError:
            latest_analysis = None

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
        },

        "total_resumes": len(resumes),

        "total_jobs": len(jobs),

        "latest_resume": (
            {
                "id": latest_resume.id,
                "filename": latest_resume.filename,
            }
            if latest_resume
            else None
        ),

        "resume_score": (
            latest_analysis.get("resume_score", 0)
            if latest_analysis
            else 0
        ),

        "candidate_summary": (
            latest_analysis.get("candidate_summary", "")
            if latest_analysis
            else ""
        ),

        "technical_skills": (
            latest_analysis.get("technical_skills", [])
            if latest_analysis
            else []
        ),

        "soft_skills": (
            latest_analysis.get("soft_skills", [])
            if latest_analysis
            else []
        ),

        "strengths": (
            latest_analysis.get("strengths", [])
            if latest_analysis
            else []
        ),

        "weaknesses": (
            latest_analysis.get("weaknesses", [])
            if latest_analysis
            else []
        ),

        "missing_skills": (
            latest_analysis.get("missing_skills", [])
            if latest_analysis
            else []
        ),

        "suitable_job_roles": (
            latest_analysis.get("suitable_job_roles", [])
            if latest_analysis
            else []
        ),

        "skill_scores": (
            latest_analysis.get("skill_scores", [])
            if latest_analysis
            else []
        ),

        "improvement_suggestions": (
            latest_analysis.get(
                "improvement_suggestions",
                [],
            )
            if latest_analysis
            else []
        ),

        "placement_preparation_plan": (
            latest_analysis.get(
                "placement_preparation_plan",
                [],
            )
            if latest_analysis
            else []
        ),

        # Keep resume/job lists available for future dashboard features
        "resumes": [
            {
                "id": resume.id,
                "filename": resume.filename,
            }
            for resume in resumes
        ],

        "jobs": [
            {
                "id": job.id,
                "title": job.title,
                "company": job.company,
            }
            for job in jobs
        ],
    }