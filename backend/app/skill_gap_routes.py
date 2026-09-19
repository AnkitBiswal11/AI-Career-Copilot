from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal
from .dependencies import get_current_user
from .models import User, Resume, JobDescription
from .skill_gap_service import analyze_skill_gap

router = APIRouter(
    prefix="/skill-gap",
    tags=["Skill Gap"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/analyze")
def analyze_skill_gap_route(
    resume_id: int,
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    job = db.query(JobDescription).filter(
        JobDescription.id == job_id,
        JobDescription.user_id == current_user.id,
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job description not found",
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Resume has no extracted text",
        )

    if not job.description:
        raise HTTPException(
            status_code=400,
            detail="Job description is empty",
        )

    analysis = analyze_skill_gap(
        resume.extracted_text,
        job.description,
    )

    return {
        "resume_id": resume.id,
        "job_id": job.id,
        "job_title": job.title,
        "company": job.company,
        "analysis": analysis,
    }