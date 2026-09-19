import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal
from .dependencies import get_current_user
from .models import (
    User,
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
# BUILD ROADMAP RESPONSE
# ============================================================

def build_roadmap_response(
    roadmap: Roadmap,
    resume: Resume,
    job: JobDescription,
    db: Session,
):
    """
    Build a clean roadmap response from the saved
    Roadmap, RoadmapStage and RoadmapItem records.
    """

    stages = (
        db.query(RoadmapStage)
        .filter(
            RoadmapStage.roadmap_id == roadmap.id
        )
        .order_by(
            RoadmapStage.stage_order
        )
        .all()
    )

    stage_data = []

    for stage in stages:

        items = (
            db.query(RoadmapItem)
            .filter(
                RoadmapItem.stage_id == stage.id
            )
            .order_by(
                RoadmapItem.item_order
            )
            .all()
        )

        stage_data.append(
            {
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
            }
        )

    # --------------------------------------------------------
    # Parse insights
    # --------------------------------------------------------

    try:
        insights = json.loads(
            roadmap.insights or "[]"
        )
    except json.JSONDecodeError:
        insights = []

    # --------------------------------------------------------
    # Parse recommendations
    # --------------------------------------------------------

    try:
        recommendations = json.loads(
            roadmap.recommendations or "[]"
        )
    except json.JSONDecodeError:
        recommendations = []

    # --------------------------------------------------------
    # Calculate overall completion
    # --------------------------------------------------------

    all_items = (
        db.query(RoadmapItem)
        .join(
            RoadmapStage,
            RoadmapItem.stage_id == RoadmapStage.id,
        )
        .filter(
            RoadmapStage.roadmap_id == roadmap.id
        )
        .all()
    )

    total_items = len(all_items)

    completed_items = sum(
        1
        for item in all_items
        if item.done
    )

    overall_completion = (
        round(
            completed_items / total_items * 100
        )
        if total_items > 0
        else 0
    )

    # --------------------------------------------------------
    # Return response
    # --------------------------------------------------------

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

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    ),
):

    # ========================================================
    # 1. VALIDATE RESUME
    # ========================================================

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

    # ========================================================
    # 2. VALIDATE JOB
    # ========================================================

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

    # ========================================================
    # 3. CHECK FOR EXISTING ROADMAP
    # ========================================================

    existing = (
        db.query(Roadmap)
        .filter(
            Roadmap.user_id == current_user.id,
            Roadmap.resume_id == resume_id,
            Roadmap.job_id == job_id,
        )
        .first()
    )

    # ========================================================
    # 4. RETURN SAVED ROADMAP
    #
    # Normal page loading should NOT regenerate AI roadmap.
    # This preserves task progress.
    # ========================================================

    if existing and not force:

        return build_roadmap_response(
            existing,
            resume,
            job,
            db,
        )

    # ========================================================
    # 5. DELETE OLD ROADMAP WHEN FORCE=true
    # ========================================================

    if existing and force:

        old_stages = (
            db.query(RoadmapStage)
            .filter(
                RoadmapStage.roadmap_id
                == existing.id
            )
            .all()
        )

        # Delete all roadmap items first
        for stage in old_stages:

            db.query(RoadmapItem).filter(
                RoadmapItem.stage_id
                == stage.id
            ).delete(
                synchronize_session=False
            )

        # Delete stages
        db.query(RoadmapStage).filter(
            RoadmapStage.roadmap_id
            == existing.id
        ).delete(
            synchronize_session=False
        )

        # Delete roadmap
        db.delete(existing)

        db.commit()

    # ========================================================
    # 6. GENERATE AI ROADMAP
    # ========================================================

    print("DEBUG: About to generate roadmap")

    roadmap_data = generate_career_roadmap(
        resume.extracted_text,
        job.description,
    )

    print("DEBUG: AI roadmap generated")
    print(
        "DEBUG: roadmap_data =",
        roadmap_data,
    )

    # ========================================================
    # 7. CREATE ROADMAP
    # ========================================================

    roadmap = Roadmap(
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=job.id,

        target_role=roadmap_data.get(
            "target_role",
            job.title or "Target Role",
        ),

        readiness_score=int(
            roadmap_data.get(
                "readiness_score",
                0,
            )
        ),

        summary=roadmap_data.get(
            "summary",
            "",
        ),

        insights=json.dumps(
            roadmap_data.get(
                "insights",
                [],
            )
        ),

        recommendations=json.dumps(
            roadmap_data.get(
                "recommendations",
                [],
            )
        ),
    )

    db.add(roadmap)

    print(
        "DEBUG: Saving roadmap to database"
    )

    db.commit()
    db.refresh(roadmap)

    print(
        "DEBUG: Roadmap saved, ID =",
        roadmap.id,
    )

    # ========================================================
    # 8. SAVE STAGES AND ITEMS
    # ========================================================

    stages = roadmap_data.get(
        "stages",
        [],
    )

    for stage_index, stage_data in enumerate(
        stages,
        start=1,
    ):

        stage = RoadmapStage(
            roadmap_id=roadmap.id,

            title=stage_data.get(
                "title",
                f"Stage {stage_index}",
            ),

            status=(
                "current"
                if stage_index == 1
                else "upcoming"
            ),

            duration_days=int(
                stage_data.get(
                    "duration_days",
                    7,
                )
            ),

            completion=0,

            stage_order=stage_index,
        )

        db.add(stage)
        db.flush()

        # ----------------------------------------------------
        # Save stage items
        # ----------------------------------------------------

        items = stage_data.get(
            "items",
            []
        )

        for item_index, item_data in enumerate(
            items,
            start=1,
        ):

            label = item_data.get(
                "label",
                "",
            ).strip()

            # Ignore empty AI-generated items
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

    # ========================================================
    # 9. RETURN SAVED ROADMAP
    # ========================================================

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

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    ),
):

    # ========================================================
    # 1. FIND ITEM
    #
    # Ownership is checked through:
    #
    # RoadmapItem
    #      ↓
    # RoadmapStage
    #      ↓
    # Roadmap
    #      ↓
    # current_user
    #
    # This prevents one user from modifying another user's
    # roadmap item.
    # ========================================================

    item = (
        db.query(RoadmapItem)
        .join(
            RoadmapStage,
            RoadmapItem.stage_id
            == RoadmapStage.id,
        )
        .join(
            Roadmap,
            RoadmapStage.roadmap_id
            == Roadmap.id,
        )
        .filter(
            RoadmapItem.id == item_id,
            Roadmap.user_id
            == current_user.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Roadmap item not found",
        )

    # ========================================================
    # 2. UPDATE CHECKBOX
    # ========================================================

    item.done = (
        1
        if item_data.done
        else 0
    )

    # ========================================================
    # 3. FIND STAGE
    # ========================================================

    stage = (
        db.query(RoadmapStage)
        .filter(
            RoadmapStage.id
            == item.stage_id
        )
        .first()
    )

    if not stage:
        raise HTTPException(
            status_code=404,
            detail="Roadmap stage not found",
        )

    # ========================================================
    # 4. RECALCULATE STAGE COMPLETION
    # ========================================================

    stage_items = (
        db.query(RoadmapItem)
        .filter(
            RoadmapItem.stage_id
            == stage.id
        )
        .all()
    )

    total_stage_items = len(
        stage_items
    )

    completed_stage_items = sum(
        1
        for current_item in stage_items
        if current_item.done
    )

    if total_stage_items > 0:

        stage.completion = round(
            completed_stage_items
            / total_stage_items
            * 100
        )

    else:

        stage.completion = 0

    # ========================================================
    # 5. FIND ROADMAP
    # ========================================================

    roadmap = (
        db.query(Roadmap)
        .filter(
            Roadmap.id
            == stage.roadmap_id,

            Roadmap.user_id
            == current_user.id,
        )
        .first()
    )

    if not roadmap:
        raise HTTPException(
            status_code=404,
            detail="Roadmap not found",
        )

    # ========================================================
    # 6. GET ALL STAGES
    # ========================================================

    all_stages = (
        db.query(RoadmapStage)
        .filter(
            RoadmapStage.roadmap_id
            == roadmap.id
        )
        .order_by(
            RoadmapStage.stage_order
        )
        .all()
    )

    # ========================================================
    # 7. RECALCULATE STAGE STATUS
    #
    # Rules:
    #
    # 100% → completed
    # First incomplete stage → current
    # Later incomplete stages → upcoming
    # ========================================================

    first_incomplete_found = False

    for current_stage in all_stages:

        if current_stage.completion >= 100:

            current_stage.status = (
                "completed"
            )

        elif not first_incomplete_found:

            current_stage.status = (
                "current"
            )

            first_incomplete_found = True

        else:

            current_stage.status = (
                "upcoming"
            )

    # ========================================================
    # 8. CALCULATE OVERALL ROADMAP PROGRESS
    # ========================================================

    all_items = (
        db.query(RoadmapItem)
        .join(
            RoadmapStage,
            RoadmapItem.stage_id
            == RoadmapStage.id,
        )
        .filter(
            RoadmapStage.roadmap_id
            == roadmap.id
        )
        .all()
    )

    total_items = len(
        all_items
    )

    completed_items = sum(
        1
        for current_item in all_items
        if current_item.done
    )

    if total_items > 0:

        overall_completion = round(
            completed_items
            / total_items
            * 100
        )

    else:

        overall_completion = 0

    # ========================================================
    # 9. UPDATE ROADMAP TIMESTAMP
    # ========================================================

    from datetime import datetime, timezone

    roadmap.updated_at = (
        datetime.now(timezone.utc)
    )

    # ========================================================
    # 10. SAVE EVERYTHING
    # ========================================================

    db.commit()

    # ========================================================
    # 11. RETURN PROGRESS INFORMATION
    # ========================================================

    return {
        "message": "Roadmap item updated successfully",

        "item_id": item.id,

        "done": bool(
            item.done
        ),

        "stage_id": stage.id,

        "stage_completion": stage.completion,

        "overall_completion": overall_completion,
    }