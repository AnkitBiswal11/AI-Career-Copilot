from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, Resume, JobDescription, Roadmap
from .auth import get_current_user
from .coach_service import generate_coach_response


router = APIRouter(
    prefix="/coach",
    tags=["AI Coach"],
)


# =========================================================
# SCHEMAS
# =========================================================

class CoachChatRequest(BaseModel):
    message: str


class CoachChatResponse(BaseModel):
    answer: str
    action_items: list[str]
    related_skills: list[str]


# =========================================================
# AI COACH
# =========================================================

@router.post(
    "/chat",
    response_model=CoachChatResponse,
)
def coach_chat(
    request: CoachChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = request.message.strip()

    if not message:
        return CoachChatResponse(
            answer="Please enter a question first.",
            action_items=[],
            related_skills=[],
        )

    # -----------------------------------------------------
    # Latest resume
    #
    # Resume does NOT have created_at in your model.
    # ID is used because uploaded resumes receive
    # increasing IDs.
    # -----------------------------------------------------

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.id.desc())
        .first()
    )

    # -----------------------------------------------------
    # Latest job
    #
    # JobDescription also uses ID ordering instead of
    # assuming a created_at column exists.
    # -----------------------------------------------------

    job = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.id.desc())
        .first()
    )

    # -----------------------------------------------------
    # Build context
    # -----------------------------------------------------

    context = {
        "user": {
            "name": current_user.name,
            "email": current_user.email,
        },
        "resume": None,
        "target_job": None,
        "roadmap": None,
    }

    # -----------------------------------------------------
    # Resume context
    # -----------------------------------------------------

    if resume:
        context["resume"] = {
            "id": resume.id,
            "filename": resume.filename,
            "extracted_text": resume.extracted_text,
            "analysis": resume.analysis,
        }

    # -----------------------------------------------------
    # Job context
    # -----------------------------------------------------

    if job:
        context["target_job"] = {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "description": job.description,
        }

    # -----------------------------------------------------
    # Roadmap context
    #
    # Roadmap DOES have created_at according to the model
    # used by your project, but ID ordering is sufficient
    # and avoids unnecessary assumptions.
    # -----------------------------------------------------

    if resume and job:
        roadmap = (
            db.query(Roadmap)
            .filter(
                Roadmap.user_id == current_user.id,
                Roadmap.resume_id == resume.id,
                Roadmap.job_id == job.id,
            )
            .order_by(Roadmap.id.desc())
            .first()
        )

        if roadmap:
            context["roadmap"] = {
                "target_role": roadmap.target_role,
                "readiness_score": roadmap.readiness_score,
                "summary": roadmap.summary,
                "insights": roadmap.insights,
                "recommendations": roadmap.recommendations,
            }

    # -----------------------------------------------------
    # Generate AI response
    # -----------------------------------------------------

    result = generate_coach_response(
        message=message,
        context=context,
    )

    return CoachChatResponse(
        answer=result.get(
            "answer",
            "I couldn't generate a response right now.",
        ),
        action_items=result.get(
            "action_items",
            [],
        ),
        related_skills=result.get(
            "related_skills",
            [],
        ),
    )