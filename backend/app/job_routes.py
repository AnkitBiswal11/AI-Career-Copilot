from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal
from .dependencies import get_current_user
from .models import JobDescription, Resume, User
from .schemas import JobCreate
from .match_service import analyze_job_match


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_job_description(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = JobDescription(
        user_id=current_user.id,
        title=job_data.title,
        company=job_data.company,
        description=job_data.description,
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return {
        "message": "Job description saved",
        "job_id": job.id,
        "title": job.title,
        "company": job.company,
    }


@router.post("/{job_id}/match/{resume_id}")
def match_resume_with_job(
    job_id: int,
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find job belonging to current user
    job = (
        db.query(JobDescription)
        .filter(
            JobDescription.id == job_id,
            JobDescription.user_id == current_user.id,
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job description not found",
        )

    # Find resume belonging to current user
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    # Resume must contain extracted text
    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Resume has no extracted text",
        )

    # Ask local Qwen model to compare them
    analysis = analyze_job_match(
        resume.extracted_text,
        job.description,
    )

    return {
        "job_id": job.id,
        "resume_id": resume.id,
        "company": job.company,
        "job_title": job.title,
        "analysis": analysis,
    }