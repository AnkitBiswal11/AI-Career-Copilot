from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class JobCreate(BaseModel):
    title: str
    company: str
    description: str


# ============================================================
# INTERVIEW COACH SCHEMAS
# ============================================================

class InterviewStartRequest(BaseModel):
    resume_id: int
    job_id: int | None = None
    interview_type: str = "technical"
    difficulty: str = "medium"
    total_questions: int = 5


class InterviewStartResponse(BaseModel):
    session_id: int
    role: str
    interview_type: str
    difficulty: str
    total_questions: int
    question_id: int
    question: str


class InterviewEvaluateRequest(BaseModel):
    session_id: int
    question_id: int
    answer: str


class InterviewEvaluateResponse(BaseModel):
    question_id: int
    score: int
    feedback: str
    strengths: list[str]
    weaknesses: list[str]
    improvement_tips: list[str]
    ideal_answer: str


class InterviewHistoryItem(BaseModel):
    session_id: int
    role: str | None
    interview_type: str
    difficulty: str
    total_questions: int
    score: int | None
    created_at: str


class RoadmapItemUpdate(BaseModel):
    done: bool