
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .database import get_db
from .dependencies import get_current_user
from .models import UserSettings, User

router = APIRouter(prefix="/users/me/settings", tags=["Settings"])


DEFAULT_SETTINGS = {
    "weeklyDigest": True,
    "skillGapAlerts": True,
    "streakReminders": True,
    "aggressiveMode": False,
    "includeGenAI": True,
    "prioritizeDSA": True,
}


def settings_to_dict(settings: UserSettings):
    return {
        "weeklyDigest": bool(settings.weekly_digest),
        "skillGapAlerts": bool(settings.skill_gap_alerts),
        "streakReminders": bool(settings.streak_reminders),
        "aggressiveMode": bool(settings.aggressive_mode),
        "includeGenAI": bool(settings.include_genai),
        "prioritizeDSA": bool(settings.prioritize_dsa),
    }


@router.get("")
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == current_user.id)
        .first()
    )

    if not settings:
        settings = UserSettings(
            user_id=current_user.id,
            weekly_digest=1,
            skill_gap_alerts=1,
            streak_reminders=1,
            aggressive_mode=0,
            include_genai=1,
            prioritize_dsa=1,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings_to_dict(settings)


@router.put("")
def update_settings(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == current_user.id)
        .first()
    )

    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    field_map = {
        "weeklyDigest": "weekly_digest",
        "skillGapAlerts": "skill_gap_alerts",
        "streakReminders": "streak_reminders",
        "aggressiveMode": "aggressive_mode",
        "includeGenAI": "include_genai",
        "prioritizeDSA": "prioritize_dsa",
    }

    for api_field, db_field in field_map.items():
        if api_field in payload:
            value = payload[api_field]
            if not isinstance(value, bool):
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=422,
                    detail=f"{api_field} must be true or false",
                )
            setattr(settings, db_field, int(value))

    db.commit()
    db.refresh(settings)

    return settings_to_dict(settings)