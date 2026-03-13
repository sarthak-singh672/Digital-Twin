import pandas as pd
import numpy as np
import json
import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text, cast, Date
from datetime import datetime, date, timedelta

from src.db import database, models
from src.api import schemas, auth

from src.core.etl import get_user_data
from src.core.feature_engineering import generate_all_features
from src.core.anomaly_detection import run_anomaly_detection
from src.core.risk_prediction import predict_academic_risk
from src.core.recommendation_engine import RecommendationEngine

app = FastAPI(
    title="Student Digital Twin API",
    description="Backend API for the Student Edition Digital Twin project.",
    version="1.5.0"
)

# ✅ CRITICAL FIX: Create tables on startup
# This ensures that when the new Postgres container starts, all tables (users, vitals, etc.) are built.
models.Base.metadata.create_all(bind=database.engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api/v1")


# =============================================
# DAILY GOALS GENERATOR
# =============================================
def generate_daily_goals(db: Session, user_id: int):
    today = date.today()
    existing_today = db.query(models.Goal).filter(
        models.Goal.user_id == user_id,
        models.Goal.date == today
    ).count()

    if existing_today > 0:
        return

    latest_recs = db.query(models.Recommendation).filter(
        models.Recommendation.user_id == user_id
    ).all()

    dynamic_goals = []
    for rec in latest_recs:
        if rec.goals:
            try:
                goals_list = json.loads(rec.goals)
                dynamic_goals.extend(goals_list)
            except Exception as e:
                print(f"Error parsing goals JSON: {e}")

    fallbacks = [
        "Maintain your current healthy habits and routines.",
        "Take a 15-minute walk outdoors for mental clarity.",
        "Use this stable state to focus on high-priority tasks."
    ]

    seen = set()
    unique_goals = []
    for g in dynamic_goals + fallbacks:
        if g not in seen:
            unique_goals.append(g)
            seen.add(g)

    final_goals = unique_goals[:3]

    for goal_text in final_goals:
        db.add(models.Goal(user_id=user_id, date=today, text=goal_text, completed=False))

    db.commit()


# =============================================
# DAY STREAK CALCULATOR
# =============================================
def calculate_day_streak(db: Session, user_id: int) -> int:
    vitals_dates = db.query(func.date(models.Vitals.ts)).filter(models.Vitals.user_id == user_id).distinct().all()
    lifestyle_dates = db.query(models.Lifestyle.date).filter(models.Lifestyle.user_id == user_id).distinct().all()
    academic_dates = db.query(models.Academic.date).filter(models.Academic.user_id == user_id).distinct().all()
    activity_dates = db.query(models.Activity.date).filter(models.Activity.user_id == user_id).distinct().all()

    all_dates = set()
    for row in vitals_dates:
        if row[0]:
            d = row[0]
            all_dates.add(d if isinstance(d, date) else d.date() if hasattr(d, 'date') else d)
    for row in lifestyle_dates + academic_dates + activity_dates:
        if row[0]:
            all_dates.add(row[0])

    if not all_dates:
        return 0

    sorted_dates = sorted(all_dates, reverse=True)
    streak = 0
    check_date = date.today()

    if sorted_dates[0] < check_date:
        check_date = sorted_dates[0]

    for d in sorted_dates:
        if d == check_date:
            streak += 1
            check_date -= timedelta(days=1)
        elif d < check_date:
            break

    return streak


# =============================================
# ACHIEVEMENTS CALCULATOR
# =============================================
def calculate_achievements(db: Session, user_id: int, health_score: float, pending_count: int) -> list:
    achievements = []
    if pending_count <= 1:
        achievements.append({"icon": "fas fa-dove", "title": "Early Bird", "description": "1 or fewer pending goals!"})

    streak = calculate_day_streak(db, user_id)
    if streak >= 3:
        achievements.append(
            {"icon": "fas fa-chart-line", "title": "Consistent Tracker", "description": f"{streak} day streak!"})

    if health_score > 70:
        achievements.append(
            {"icon": "fas fa-heart", "title": "Health Champion", "description": "Health score above 70!"})

    return achievements


# =============================================
# BACKGROUND ANALYSIS
# =============================================
def run_full_analysis(db: Session, user: models.User):
    try:
        df = get_user_data(db, user.user_id)
        if df is None or df.empty: return

        df_features = generate_all_features(df)
        if df_features is None or df_features.empty: return

        alerts = run_anomaly_detection(df_features)
        formatted_anomalies = []
        if alerts:
            for alert_str in alerts:
                today = date.today()
                existing_alert = db.query(models.Alert).filter(
                    models.Alert.user_id == user.user_id, models.Alert.alert_type == alert_str,
                    func.date(models.Alert.alert_ts) == today).first()
                if not existing_alert:
                    db.add(models.Alert(user_id=user.user_id, alert_type=alert_str, resolved_flag=False))
                formatted_anomalies.append({'metric': 'heart_rate' if 'heart' in alert_str.lower() else alert_str})

        risk_score, risk_label = predict_academic_risk(df_features)
        db.add(models.Prediction(user_id=user.user_id, model="RandomForest_v1",
                                 risk_score=float(risk_score), label=risk_label, pred_ts=datetime.now()))

        recommender = RecommendationEngine()
        latest_features = {
            "stress_score": float(df_features.iloc[-1].get('stress_score', 5.0)),
            "sleep_hrs": float(df_features.iloc[-1].get('sleep_hrs', 7.0)),
            "study_hrs": float(df_features.iloc[-1].get('study_hrs', 5.0)),
            "hr": float(df_features.iloc[-1].get('hr', 75.0)),
            "water_glasses": int(df_features.iloc[-1].get('water_glasses', 6.0))
        }

        insights = recommender.generate_all_insights(latest_features, formatted_anomalies, float(risk_score))
        db.query(models.Recommendation).filter(models.Recommendation.user_id == user.user_id).delete()

        for insight in insights:
            db.add(models.Recommendation(
                user_id=user.user_id,
                type=insight.get('severity', 'info'),
                title=insight.get('title', 'Health Insight'),
                explanation=insight.get('explanation', ''),
                causes=json.dumps(insight.get('causes', [])),
                goals=json.dumps(insight.get('health_goals', insight.get('goals', [])))
            ))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Background analysis error: {e}")


# --- Auth Endpoints ---
@router.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = auth.get_user(db, email=user.email)
    if db_user: raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(email=user.email, hashed_password=auth.get_password_hash(user.password),
                           username=user.username, first_name=user.first_name, last_name=user.last_name, consent=True)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/auth/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.get_user(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    access_token = auth.create_access_token(data={"sub": str(user.user_id)})
    return {"access_token": access_token, "token_type": "bearer"}


# --- Data Entry Endpoints ---
@router.post("/data/vitals")
def submit_vitals(data: schemas.VitalsData, bg: BackgroundTasks, db: Session = Depends(database.get_db),
                  user=Depends(auth.get_current_user)):
    record_ts = data.ts if data.ts else datetime.now()
    existing = db.query(models.Vitals).filter(models.Vitals.user_id == user.user_id,
                                              func.date(models.Vitals.ts) == record_ts.date()).first()
    if existing:
        for k, v in data.model_dump(exclude_unset=True).items(): setattr(existing, k, v)
        existing.ts = record_ts
    else:
        db.add(models.Vitals(user_id=user.user_id, **data.model_dump(), ts=record_ts))
    db.commit()
    bg.add_task(run_full_analysis, db, user)
    return {"status": "success"}


@router.post("/data/lifestyle")
def submit_lifestyle(data: schemas.LifestyleData, bg: BackgroundTasks, db: Session = Depends(database.get_db),
                     user=Depends(auth.get_current_user)):
    existing = db.query(models.Lifestyle).filter(models.Lifestyle.user_id == user.user_id,
                                                 models.Lifestyle.date == data.date).first()
    if existing:
        for k, v in data.model_dump().items(): setattr(existing, k, v)
    else:
        db.add(models.Lifestyle(user_id=user.user_id, **data.model_dump()))
    db.commit()
    bg.add_task(run_full_analysis, db, user)
    return {"status": "success"}


@router.post("/data/activity")
def submit_activity(data: schemas.ActivityData, bg: BackgroundTasks, db: Session = Depends(database.get_db),
                    user=Depends(auth.get_current_user)):
    existing = db.query(models.Activity).filter(models.Activity.user_id == user.user_id,
                                                models.Activity.date == data.date).first()
    if existing:
        for k, v in data.model_dump().items(): setattr(existing, k, v)
    else:
        db.add(models.Activity(user_id=user.user_id, **data.model_dump()))
    db.commit()
    bg.add_task(run_full_analysis, db, user)
    return {"status": "success"}


@router.post("/data/academic")
def submit_academic(data: schemas.AcademicData, bg: BackgroundTasks, db: Session = Depends(database.get_db),
                    user=Depends(auth.get_current_user)):
    existing = db.query(models.Academic).filter(models.Academic.user_id == user.user_id,
                                                models.Academic.date == data.date).first()
    if existing:
        for k, v in data.model_dump(exclude_unset=True).items(): setattr(existing, k, v)
    else:
        db.add(models.Academic(user_id=user.user_id, **data.model_dump()))
    db.commit()
    bg.add_task(run_full_analysis, db, user)
    return {"status": "success"}


# =============================================
# GOALS ENDPOINTS
# =============================================
@router.get("/goals/active")
def get_active_goals(db: Session = Depends(database.get_db), user=Depends(auth.get_current_user)):
    generate_daily_goals(db, user.user_id)
    today = date.today()
    all_pending = db.query(models.Goal).filter(models.Goal.user_id == user.user_id,
                                               models.Goal.completed == False).order_by(models.Goal.date.desc()).all()
    goals_list = [
        {"id": g.id, "text": g.text, "date": g.date.isoformat(), "completed": g.completed, "is_today": g.date == today}
        for g in all_pending]
    return {"goals": goals_list, "active_count": len(all_pending)}


@router.put("/goals/{goal_id}/complete")
def complete_goal(goal_id: int, db: Session = Depends(database.get_db), user=Depends(auth.get_current_user)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == user.user_id).first()
    if not goal: raise HTTPException(status_code=404, detail="Goal not found")
    goal.completed = True
    db.commit()
    return {"status": "success"}


# =============================================
# PROFILE STATS ENDPOINT
# =============================================
@router.get("/profile/stats")
def get_profile_stats(db: Session = Depends(database.get_db), user=Depends(auth.get_current_user)):
    latest_pred = db.query(models.Prediction).filter(models.Prediction.user_id == user.user_id).order_by(
        desc(models.Prediction.pred_ts)).first()

    df = get_user_data(db, user.user_id)
    current_wellness = 5.0
    if df is not None and not df.empty:
        try:
            df_features = generate_all_features(df)
            current_wellness = float(df_features.iloc[-1].get('WellnessScore', 5.0))
        except:
            pass

    ai_risk = float(latest_pred.risk_score if latest_pred else 0.2)
    health_score = round(min(max((current_wellness * 7) + ((1 - ai_risk) * 30), 0), 100), 1)
    display_label = "Optimal" if health_score > 75 else "Normal" if health_score >= 60 else "At Risk"

    today = date.today()
    pending_goals = db.query(models.Goal).filter(models.Goal.user_id == user.user_id,
                                                 models.Goal.completed == False).all()

    today_lifestyle = db.query(models.Lifestyle).filter(models.Lifestyle.user_id == user.user_id,
                                                        models.Lifestyle.date == today).first()
    all_lifestyle = db.query(models.Lifestyle).filter(models.Lifestyle.user_id == user.user_id).all()

    # ✅ FIXED INDENTATION HERE
    current_sleep = float(today_lifestyle.sleep_hrs) if today_lifestyle and today_lifestyle.sleep_hrs else 0.0
    sleep_target = 8.0
    sleep_progress = 0
    if all_lifestyle:
        avg_sleep = sum(l.sleep_hrs or 0 for l in all_lifestyle) / len(all_lifestyle)
        sleep_progress = min(round((avg_sleep / sleep_target) * 100, 1), 100)

    current_stress = float(today_lifestyle.stress_score) if today_lifestyle and today_lifestyle.stress_score else 0.0
    stress_target = 4.0
    stress_progress = 0
    if all_lifestyle:
        avg_stress = sum(l.stress_score or 0 for l in all_lifestyle) / len(all_lifestyle)
        stress_progress = 100.0 if avg_stress <= stress_target else min(round((stress_target / avg_stress) * 100, 1),
                                                                        100)

    return {
        "health_score": health_score,
        "health_label": display_label,
        "day_streak": calculate_day_streak(db, user.user_id),
        "active_goals": len(pending_goals),
        "health_goals": [
            {"title": "Improve Sleep Quality", "target": sleep_target, "current": current_sleep,
             "progress": sleep_progress, "unit": "hours"},
            {"title": "Reduce Stress Level", "target": stress_target, "current": current_stress,
             "progress": stress_progress, "unit": "level"}
        ]
    }


# =============================================
# ANALYTICS SUMMARY
# =============================================
@router.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(database.get_db), user=Depends(auth.get_current_user)):
    latest = db.query(models.Prediction).filter(models.Prediction.user_id == user.user_id).order_by(
        desc(models.Prediction.pred_ts)).first()
    active_alerts = db.query(models.Alert).filter(models.Alert.user_id == user.user_id,
                                                  models.Alert.resolved_flag == False).all()

    df = get_user_data(db, user.user_id)
    current_wellness = 5.0
    chart_data = []
    if df is not None and not df.empty:
        df_features = generate_all_features(df)
        current_wellness = float(df_features.iloc[-1].get('WellnessScore', 5.0))
        chart_data = df_features.replace({np.nan: None}).to_dict(orient='records')

    ai_risk = float(latest.risk_score if latest else 0.2)
    final_health_score = round(min(max((current_wellness * 7) + ((1 - ai_risk) * 30), 0), 100), 1)
    display_label = "Optimal" if final_health_score > 75 else "Normal" if final_health_score >= 60 else "At Risk"

    db_recs = db.query(models.Recommendation).filter(models.Recommendation.user_id == user.user_id).all()
    parsed_recs = [{"id": r.id, "type": r.type, "title": r.title, "explanation": r.explanation,
                    "causes": json.loads(r.causes) if r.causes else [], "goals": json.loads(r.goals) if r.goals else []}
                   for r in db_recs]

    return {
        "health_score": final_health_score,
        "risk_label": display_label,
        "chart_data": chart_data,
        "recommendations": parsed_recs
    }


# --- Standard Getters & User Logic ---
@router.get("/data/vitals", response_model=schemas.VitalsResponse)
def get_vitals(db: Session = Depends(database.get_db), user=Depends(auth.get_current_user)):
    return {"results": db.query(models.Vitals).filter(models.Vitals.user_id == user.user_id).all()}


@router.get("/users/me", response_model=schemas.User)
def read_users_me(user: models.User = Depends(auth.get_current_user)):
    return user


if os.path.exists("frontend"):
    app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/frontend/login.html")


app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)