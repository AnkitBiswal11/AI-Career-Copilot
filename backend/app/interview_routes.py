from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal
from .dependencies import get_current_user
from .models import (
    User,
    Resume,
    JobDescription,
    InterviewSession,
    InterviewQuestion,
)
from .schemas import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewEvaluateRequest,
    InterviewEvaluateResponse,
    InterviewHistoryItem,
)
from .interview_service import (
    generate_interview_question,
    evaluate_interview_answer,
)

router = APIRouter(
    prefix="/interview",
    tags=["Interview Coach"],
)

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# START INTERVIEW
# ============================================================

@router.post("/start", response_model=InterviewStartResponse)
def start_interview(
    data: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate resume
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == data.resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Resume does not contain extracted text",
        )

    # Validate job if supplied
    job = None

    if data.job_id is not None:
        job = (
            db.query(JobDescription)
            .filter(
                JobDescription.id == data.job_id,
                JobDescription.user_id == current_user.id,
            )
            .first()
        )

        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job description not found",
            )

    # Determine role
    role = (
        job.title
        if job and job.title
        else "Software Developer"
    )

    job_description = (
        job.description
        if job
        else "General software development interview"
    )

    # Validate interview type and difficulty
    allowed_types = {
        "technical",
        "hr",
        "mixed",
    }

    allowed_difficulties = {
        "easy",
        "medium",
        "hard",
    }

    interview_type = data.interview_type.lower()
    difficulty = data.difficulty.lower()

    if interview_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Interview type must be technical, hr, or mixed",
        )

    if difficulty not in allowed_difficulties:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be easy, medium, or hard",
        )

    total_questions = max(
        1,
        min(data.total_questions, 20)
    )

    # Create session
    session = InterviewSession(
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=job.id if job else None,
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        total_questions=total_questions,
        score=None,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate first question
    ai_result = generate_interview_question(
        resume_text=resume.extracted_text,
        job_description=job_description,
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        previous_questions=[],
    )
    
    question_text = ai_result.get(
        "question",
        "Tell me about your technical experience.",
    )

    question = InterviewQuestion(
        session_id=session.id,
        question=question_text,
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return InterviewStartResponse(
        session_id=session.id,
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        total_questions=total_questions,
        question_id=question.id,
        question=question_text,
    )


# ============================================================
# EVALUATE ANSWER
# ============================================================

@router.post(
    "/evaluate",
    response_model=InterviewEvaluateResponse,
)
def evaluate_answer(
    data: InterviewEvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find session
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == data.session_id,
            InterviewSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found",
        )

    # Find question
    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.id == data.question_id,
            InterviewQuestion.session_id == session.id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Interview question not found",
        )

    if not data.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty",
        )

    # Get resume
    resume = (
        db.query(Resume)
        .filter(Resume.id == session.resume_id)
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    # Get job description
    job_description = ""

    if session.job_id:
        job = (
            db.query(JobDescription)
            .filter(JobDescription.id == session.job_id)
            .first()
        )

        if job:
            job_description = job.description

    # AI evaluation
    result = evaluate_interview_answer(
        question=question.question,
        answer=data.answer,
        resume_text=resume.extracted_text or "",
        job_description=job_description,
    )

    # Save answer + evaluation
    question.user_answer = data.answer
    question.score = result.get("score", 0)
    question.feedback = result.get("feedback", "")
    question.ideal_answer = result.get("ideal_answer", "")

    # Update session score based on all answered questions
    answered_questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.session_id == session.id,
            InterviewQuestion.score.isnot(None),
        )
        .all()
    )

    scores = [
        q.score
        for q in answered_questions
        if q.score is not None
    ]

    # Include the current answer in the calculation
    if question.score is not None:
        scores.append(question.score)

    if scores:
        average_score = sum(scores) / len(scores)

        # Individual question score is 0-10.
        # Session score is stored as 0-100.
        session.score = round(average_score * 10)

    db.commit()

    return InterviewEvaluateResponse(
        question_id=question.id,
        score=result.get("score", 0),
        feedback=result.get("feedback", ""),
        strengths=result.get("strengths", []),
        weaknesses=result.get("weaknesses", []),
        improvement_tips=result.get("improvement_tips", []),
        ideal_answer=result.get("ideal_answer", ""),
    )


# ============================================================
# NEXT QUESTION
# ============================================================

@router.post("/next", response_model=InterviewStartResponse)
def next_question(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find interview session
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found",
        )

    # Get resume
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == session.resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    # Get job description
    job_description = "General software development interview"

    if session.job_id:
        job = (
            db.query(JobDescription)
            .filter(
                JobDescription.id == session.job_id,
                JobDescription.user_id == current_user.id,
            )
            .first()
        )

        if job:
            job_description = job.description

    # Get questions already generated in this session
    existing_questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.session_id == session.id,
        )
        .order_by(InterviewQuestion.id.asc())
        .all()
    )

    # Check whether interview is already complete
    if len(existing_questions) >= session.total_questions:
        raise HTTPException(
            status_code=400,
            detail="Interview is already complete",
        )

    previous_questions = [
        q.question
        for q in existing_questions
    ]

    # Ask AI for the next question
    ai_result = generate_interview_question(
        resume_text=resume.extracted_text or "",
        job_description=job_description,
        role=session.role or "Software Developer",
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        previous_questions=previous_questions,
    )

    question_text = ai_result.get(
        "question",
        "Tell me about a challenging project you worked on.",
    )

    # Save new question to the same session
    question = InterviewQuestion(
        session_id=session.id,
        question=question_text,
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return InterviewStartResponse(
        session_id=session.id,
        role=session.role or "Software Developer",
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        total_questions=session.total_questions,
        question_id=question.id,
        question=question_text,
    )

# ============================================================
# INTERVIEW HISTORY
# ============================================================

@router.get(
    "/history",
    response_model=list[InterviewHistoryItem],
)
def interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id == current_user.id
        )
        .order_by(
            InterviewSession.id.desc()
        )
        .all()
    )

    results = []

    for session in sessions:
        results.append(
            InterviewHistoryItem(
                session_id=session.id,
                role=session.role,
                interview_type=session.interview_type,
                difficulty=session.difficulty,
                total_questions=session.total_questions,
                score=session.score,
                created_at=session.created_at.isoformat()
                if session.created_at
                else "",
            )
        )

    return results