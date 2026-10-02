
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal
from .dependencies import get_current_user
from .models import (
    User,
    UserSettings,
    Resume,
    JobDescription,
    Roadmap,
    RoadmapStage,
    RoadmapItem,
)
from .roadmap_service import generate_career_roadmap
from .schemas import RoadmapItemUpdate


router = APIRouter(
    prefix="/roadmap",
    tags=["Career Roadmap"],
)


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# DEFAULT USER SETTINGS
# ============================================================

DEFAULT_SETTINGS = {
    "weeklyDigest": True,
    "skillGapAlerts": True,
    "streakReminders": True,
    "aggressiveMode": False,
    "includeGenAI": True,
    "prioritizeDSA": True,
}


def get_user_settings(db: Session, user_id: int):
    """
    Get the user's saved settings.
    Create a default settings row if one does not exist.
    """

    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )

    if settings:
        return settings

    settings = UserSettings(
        user_id=user_id,
        weekly_digest=int(DEFAULT_SETTINGS["weeklyDigest"]),
        skill_gap_alerts=int(DEFAULT_SETTINGS["skillGapAlerts"]),
        streak_reminders=int(DEFAULT_SETTINGS["streakReminders"]),
        aggressive_mode=int(DEFAULT_SETTINGS["aggressiveMode"]),
        include_genai=int(DEFAULT_SETTINGS["includeGenAI"]),
        prioritize_dsa=int(DEFAULT_SETTINGS["prioritizeDSA"]),
    )

    db.add(settings)
    db.commit()
    db.refresh(settings)

    return settings


def build_roadmap_settings(settings: UserSettings) -> dict:
    """
    Convert database settings into the format expected
    by generate_career_roadmap().
    """

    return {
        "aggressiveMode": bool(settings.aggressive_mode),
        "includeGenAI": bool(settings.include_genai),
        "prioritizeDSA": bool(settings.prioritize_dsa),
    }


# ============================================================
# BUILD ROADMAP RESPONSE
# ============================================================

def build_roadmap_response(
    roadmap: Roadmap,
    resume: Resume,
    job: JobDescription,
    db: Session,
):
    stages = (
        db.query(RoadmapStage)
        .filter(RoadmapStage.roadmap_id == roadmap.id)
        .order_by(RoadmapStage.stage_order)
        .all()
    )

    stage_data = []

    for stage in stages:
        items = (
            db.query(RoadmapItem)
            .filter(RoadmapItem.stage_id == stage.id)
            .order_by(RoadmapItem.item_order)
            .all()
        )

        stage_data.append({
            "id": stage.id,
            "title": stage.title,
            "status": stage.status,
            "duration_days": stage.duration_days,
            "completion": stage.completion,
            "items": [
                {
                    "id": item.id,
                    "label": item.label,
                    "done": bool(item.done),
                }
                for item in items
            ],
        })

    try:
        insights = json.loads(roadmap.insights or "[]")
    except (json.JSONDecodeError, TypeError):
        insights = []

    try:
        recommendations = json.loads(
            roadmap.recommendations or "[]"
        )
    except (json.JSONDecodeError, TypeError):
        recommendations = []

    all_items = (
        db.query(RoadmapItem)
        .join(
            RoadmapStage,
            RoadmapItem.stage_id == RoadmapStage.id,
        )
        .filter(RoadmapStage.roadmap_id == roadmap.id)
        .all()
    )

    total_items = len(all_items)
    completed_items = sum(
        1 for item in all_items if item.done
    )

    overall_completion = (
        round(completed_items / total_items * 100)
        if total_items > 0
        else 0
    )

    return {
        "resume_id": resume.id,
        "job_id": job.id,
        "job_title": job.title,
        "company": job.company,
        "roadmap": {
            "id": roadmap.id,
            "target_role": roadmap.target_role,
            "readiness_score": roadmap.readiness_score,
            "summary": roadmap.summary,
            "overall_completion": overall_completion,
            "stages": stage_data,
            "insights": insights,
            "recommendations": recommendations,
        },
    }


# ============================================================
# GENERATE / LOAD CAREER ROADMAP
# ============================================================

@router.post("/generate")
def generate_roadmap(
    resume_id: int,
    job_id: int,
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. VALIDATE RESUME

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

    # 2. VALIDATE JOB

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

    # 3. CHECK FOR EXISTING ROADMAP

    existing = (
        db.query(Roadmap)
        .filter(
            Roadmap.user_id == current_user.id,
            Roadmap.resume_id == resume_id,
            Roadmap.job_id == job_id,
        )
        .first()
    )

    # 4. RETURN SAVED ROADMAP UNLESS FORCE IS TRUE

    if existing and not force:
        return build_roadmap_response(
            existing,
            resume,
            job,
            db,
        )

    # 5. LOAD USER SETTINGS

    settings = get_user_settings(
        db,
        current_user.id,
    )

    roadmap_settings = build_roadmap_settings(settings)

    # 6. DELETE OLD ROADMAP WHEN FORCE IS TRUE

    if existing and force:
        old_stages = (
            db.query(RoadmapStage)
            .filter(
                RoadmapStage.roadmap_id == existing.id
            )
            .all()
        )

        for stage in old_stages:
            db.query(RoadmapItem).filter(
                RoadmapItem.stage_id == stage.id
            ).delete(synchronize_session=False)

        db.query(RoadmapStage).filter(
            RoadmapStage.roadmap_id == existing.id
        ).delete(synchronize_session=False)

        db.delete(existing)
        db.commit()

    # 7. GENERATE AI ROADMAP USING USER PREFERENCES

    print("DEBUG: About to generate roadmap")

    try:
        roadmap_data = generate_career_roadmap(
            resume.extracted_text,
            job.description,
            settings=roadmap_settings,
        )

    except Exception as exc:
        db.rollback()
        print("ERROR: Roadmap generation failed:", str(exc))

        raise HTTPException(
            status_code=500,
            detail="Unable to generate roadmap. Please try again.",
        )

    if not isinstance(roadmap_data, dict):
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="AI returned an invalid roadmap.",
        )

    if roadmap_data.get("error"):
        db.rollback()
        print(
            "ERROR: AI roadmap generation failed:",
            roadmap_data["error"],
        )
        raise HTTPException(
            status_code=500,
            detail="Unable to generate roadmap. Please try again.",
        )

    print("DEBUG: AI roadmap generated")

    # 8. CREATE ROADMAP

    try:
        roadmap = Roadmap(
            user_id=current_user.id,
            resume_id=resume.id,
            job_id=job.id,
            target_role=(
                roadmap_data.get("target_role")
                or job.title
                or "Target Role"
            ),
            readiness_score=max(
                0,
                min(
                    int(roadmap_data.get("readiness_score", 0)),
                    100,
                ),
            ),
            summary=roadmap_data.get("summary", ""),
            insights=json.dumps(
                roadmap_data.get("insights", [])
            ),
            recommendations=json.dumps(
                roadmap_data.get("recommendations", [])
            ),
        )

        db.add(roadmap)
        db.flush()

        # 9. SAVE STAGES AND ITEMS

        stages = roadmap_data.get("stages", [])

        for stage_index, stage_data in enumerate(
            stages,
            start=1,
        ):
            if not isinstance(stage_data, dict):
                continue

            title = str(
                stage_data.get("title", "")
            ).strip()

            if not title:
                continue

            try:
                duration_days = int(
                    stage_data.get("duration_days", 7)
                )
            except (TypeError, ValueError):
                duration_days = 7

            duration_days = max(
                1,
                min(duration_days, 120),
            )

            stage = RoadmapStage(
                roadmap_id=roadmap.id,
                title=title,
                status=(
                    "current"
                    if stage_index == 1
                    else "upcoming"
                ),
                duration_days=duration_days,
                completion=0,
                stage_order=stage_index,
            )

            db.add(stage)
            db.flush()

            items = stage_data.get("items", [])

            if not isinstance(items, list):
                continue

            for item_index, item_data in enumerate(
                items,
                start=1,
            ):
                if isinstance(item_data, dict):
                    label = str(
                        item_data.get("label", "")
                    ).strip()
                else:
                    label = str(item_data).strip()

                if not label:
                    continue

                item = RoadmapItem(
                    stage_id=stage.id,
                    label=label,
                    done=0,
                    item_order=item_index,
                )

                db.add(item)

        db.commit()
        db.refresh(roadmap)

        print("DEBUG: Roadmap saved, ID =", roadmap.id)

    except Exception as exc:
        db.rollback()
        print("ERROR: Failed to save roadmap:", str(exc))

        raise HTTPException(
            status_code=500,
            detail="Unable to save roadmap. Please try again.",
        )

    # 10. RETURN SAVED ROADMAP

    return build_roadmap_response(
        roadmap,
        resume,
        job,
        db,
    )


# ============================================================
# UPDATE ROADMAP ITEM
# ============================================================

@router.patch("/items/{item_id}")
def update_roadmap_item(
    item_id: int,
    item_data: RoadmapItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. FIND ITEM AND VERIFY OWNERSHIP

    item = (
        db.query(RoadmapItem)
        .join(
            RoadmapStage,
            RoadmapItem.stage_id == RoadmapStage.id,
        )
        .join(
            Roadmap,
            RoadmapStage.roadmap_id == Roadmap.id,
        )
        .filter(
            RoadmapItem.id == item_id,
            Roadmap.user_id == current_user.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Roadmap item not found",
        )

    # 2. UPDATE CHECKBOX

    item.done = 1 if item_data.done else 0

    # 3. FIND STAGE

    stage = (
        db.query(RoadmapStage)
        .filter(RoadmapStage.id == item.stage_id)
        .first()
    )

    if not stage:
        raise HTTPException(
            status_code=404,
            detail="Roadmap stage not found",
        )

    # 4. RECALCULATE STAGE COMPLETION

    stage_items = (
        db.query(RoadmapItem)
        .filter(RoadmapItem.stage_id == stage.id)
        .all()
    )

    total_stage_items = len(stage_items)
    completed_stage_items = sum(
        1 for current_item in stage_items
        if current_item.done
    )

    stage.completion = (
        round(
            completed_stage_items
            / total_stage_items
            * 100
        )
        if total_stage_items > 0
        else 0
    )

    # 5. FIND ROADMAP

    roadmap = (
        db.query(Roadmap)
        .filter(
            Roadmap.id == stage.roadmap_id,
            Roadmap.user_id == current_user.id,
        )
        .first()
    )

    if not roadmap:
        raise HTTPException(
            status_code=404,
            detail="Roadmap not found",
        )

    # 6. RECALCULATE STAGE STATUS

    all_stages = (
        db.query(RoadmapStage)
        .filter(RoadmapStage.roadmap_id == roadmap.id)
        .order_by(RoadmapStage.stage_order)
        .all()
    )

    first_incomplete_found = False

    for current_stage in all_stages:
        if current_stage.completion >= 100:
            current_stage.status = "completed"
        elif not first_incomplete_found:
            current_stage.status = "current"
            first_incomplete_found = True
        else:
            current_stage.status = "upcoming"

    # 7. CALCULATE OVERALL PROGRESS

    all_items = (
        db.query(RoadmapItem)
        .join(
            RoadmapStage,
            RoadmapItem.stage_id == RoadmapStage.id,
        )
        .filter(RoadmapStage.roadmap_id == roadmap.id)
        .all()
    )

    total_items = len(all_items)
    completed_items = sum(
        1 for current_item in all_items
        if current_item.done
    )

    overall_completion = (
        round(completed_items / total_items * 100)
        if total_items > 0
        else 0
    )

    # 8. UPDATE TIMESTAMP

    roadmap.updated_at = datetime.now(timezone.utc)

    # 9. SAVE

    db.commit()

    # 10. RETURN PROGRESS

    return {
        "message": "Roadmap item updated successfully",
        "item_id": item.id,
        "done": bool(item.done),
        "stage_id": stage.id,
        "stage_completion": stage.completion,
        "overall_completion": overall_completion,
    }