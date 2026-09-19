import os
import uuid
import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from pypdf import PdfReader

from .database import SessionLocal
from .models import Resume, User
from .dependencies import get_current_user

from .ai_service import analyze_resume


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    os.makedirs("uploads", exist_ok=True)

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join("uploads", unique_filename)

    file_content = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    try:
        reader = PdfReader(file_path)

        extracted_text = ""

        for page in reader.pages:
            text = page.extract_text()

            if text:
                extracted_text += text + "\n"

    except Exception:
        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=400,
            detail="Could not read the PDF"
        )

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "message": "Resume uploaded successfully",
        "resume_id": resume.id,
        "filename": resume.filename,
        "text_length": len(extracted_text)
    }





@router.post("/{resume_id}/analyze")
def analyze_resume_endpoint(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="No text found in resume"
        )

    analysis = analyze_resume(resume.extracted_text)

    # Save AI analysis permanently in MySQL
    resume.analysis = json.dumps(analysis)

    db.commit()
    db.refresh(resume)

    return {
        "resume_id": resume.id,
        "analysis": analysis
    }



@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    saved_analysis = None

    if resume.analysis:
        try:
            saved_analysis = json.loads(resume.analysis)
        except json.JSONDecodeError:
            saved_analysis = None

    return {
        "resume_id": resume.id,
        "filename": resume.filename,
        "analysis": saved_analysis
    }