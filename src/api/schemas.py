from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import date, datetime
from typing import Optional, List


# --- Auth & User Models ---
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str
    first_name: str
    last_name: str


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    email: EmailStr
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    # ✅ NEW: Include avatar in user response
    avatar: Optional[str] = None
    theme: Optional[str] = 'ocean'


# ✅ NEW: Schema for updating profile
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None
    theme: Optional[str] = None


# --- Data Entry Models ---
class LifestyleData(BaseModel):
    date: date
    sleep_hrs: float = 0.0
    stress_score: int = 3
    water_glasses: Optional[int] = 0
    diet_score: Optional[int] = 5


class AcademicData(BaseModel):
    date: date
    study_hrs: float = 0.0
    attendance_pct: float = 100.0
    assignments_on_time: Optional[int] = 1


class ActivityData(BaseModel):
    date: date
    steps: int = 0
    exercise_mins: int = 0

    model_config = ConfigDict(from_attributes=True)


class VitalsData(BaseModel):
    ts: Optional[datetime] = None
    hr: float = 72.0
    temp: float = 36.6
    bp_sys: Optional[int] = 120
    bp_dia: Optional[int] = 80
    spo2: Optional[int] = 98


# --- Dashboard Summary Models ---
class VitalsSummary(BaseModel):
    avg_heart_rate: float = 0.0
    avg_spo2: float = 98.0
    count: int = 0


class LifestyleSummary(BaseModel):
    avg_sleep: float = 0.0
    avg_stress: float = 0.0
    count: int = 0


class AcademicSummary(BaseModel):
    avg_study_hours: float = 0.0
    avg_attendance: float = 100.0
    count: int = 0


class RecommendationBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    type: str
    title: str
    explanation: str
    causes: List[str]
    goals: List[str]


class RecommendationRead(RecommendationBase):
    id: int
    created_at: datetime


class RecommendationResponse(BaseModel):
    results: List[RecommendationRead]


class AnalyticsSummary(BaseModel):
    risk_score: float
    risk_label: str
    timestamp: datetime
    vitals: VitalsSummary
    lifestyle: LifestyleSummary
    academic: AcademicSummary
    ai_metadata: Optional[dict] = None
    recommendations: List[RecommendationRead] = []


class VitalsBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    ts: datetime
    hr: float
    temp: float
    bp_sys: Optional[int] = None
    bp_dia: Optional[int] = None
    spo2: Optional[int] = None


class LifestyleBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: date
    sleep_hrs: float
    stress_score: int
    diet_score: int
    water_glasses: Optional[int] = None


class AcademicBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: date
    study_hrs: float
    attendance_pct: float
    assignments_on_time: Optional[int] = None


class ActivityBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: date
    steps: int
    exercise_mins: int


class VitalsResponse(BaseModel):
    results: List[VitalsBase]


class LifestyleResponse(BaseModel):
    results: List[LifestyleBase]


class AcademicResponse(BaseModel):
    results: List[AcademicBase]


class ActivityResponse(BaseModel):
    results: List[ActivityBase]


class Prediction(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    pred_ts: datetime
    model: str
    risk_score: float
    label: str


class Alert(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    alert_ts: datetime
    alert_type: str
    resolved_flag: bool = False


class GoalCreate(BaseModel):
    text: str
    date: Optional[date] = None


class GoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    date: date
    completed: bool
    created_at: datetime


class GoalUpdate(BaseModel):
    completed: bool