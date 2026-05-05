import os
import random
from datetime import datetime, timedelta

from sqlalchemy import create_engine, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker

from src.db import models

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set.")

if "sslmode=" not in DATABASE_URL:
    separator = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

USER_IDS = [1, 2]

USER_PROFILES = {
    1: {
        "name": "divyansh",
        "vitals": {"hr": 73, "bp_sys": 118, "bp_dia": 76, "spo2": 98, "temp": 98.4},
        "lifestyle": {"sleep_hrs": 7.2, "stress_score": 3, "water_glasses": 9, "diet_score": 4},
        "activity": {"steps": 8200, "exercise_mins": 32},
        "academic": {"study_hrs": 4.6, "attendance_pct": 94, "assignments_on_time": 4},
        "goals": [
            "Drink 8 glasses of water today.",
            "Take a 20-minute walk after lunch.",
            "Review lecture notes for 45 minutes.",
            "Stretch for 10 minutes before bed.",
            "Log meals with a balanced plate.",
            "Finish one assignment section early.",
            "Aim for lights-out by 11:00 PM."
        ],
    },
    2: {
        "name": "yash",
        "vitals": {"hr": 78, "bp_sys": 121, "bp_dia": 78, "spo2": 97, "temp": 98.6},
        "lifestyle": {"sleep_hrs": 6.8, "stress_score": 4, "water_glasses": 8, "diet_score": 3},
        "activity": {"steps": 7200, "exercise_mins": 28},
        "academic": {"study_hrs": 4.0, "attendance_pct": 92, "assignments_on_time": 3},
        "goals": [
            "Hit 7,000 steps today.",
            "Take a 5-minute breathing break.",
            "Focus on a 60-minute study block.",
            "Add one extra glass of water.",
            "Do a 15-minute stretch session.",
            "Prep for class 30 minutes early.",
            "Limit caffeine after 3:00 PM."
        ],
    }
}

DAYS_TO_SEED = 30
SEED_MULTIPLIER = 1000


def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def get_existing_dates(query):
    return {row[0] for row in query if row[0]}


def insert_rows(db, table, rows, conflict_cols=None):
    if not rows:
        return 0
    stmt = insert(table).values(rows)
    if conflict_cols:
        stmt = stmt.on_conflict_do_nothing(index_elements=conflict_cols)
    else:
        stmt = stmt.on_conflict_do_nothing()
    result = db.execute(stmt)
    return result.rowcount or 0


def generate_fake_data():
    db = SessionLocal()
    try:
        today_date = datetime.now().date()

        for user_id in USER_IDS:
            profile = USER_PROFILES[user_id]
            print(f"🚀 Generating {DAYS_TO_SEED} days of data for User ID: {user_id} ({profile['name']})...")
            rng = random.Random(user_id * SEED_MULTIPLIER)

            existing_vitals_dates = get_existing_dates(
                db.query(func.date(models.Vitals.ts)).filter(models.Vitals.user_id == user_id).all()
            )
            existing_lifestyle_dates = get_existing_dates(
                db.query(models.Lifestyle.date).filter(models.Lifestyle.user_id == user_id).all()
            )
            existing_activity_dates = get_existing_dates(
                db.query(models.Activity.date).filter(models.Activity.user_id == user_id).all()
            )
            existing_academic_dates = get_existing_dates(
                db.query(models.Academic.date).filter(models.Academic.user_id == user_id).all()
            )
            existing_goal_dates = get_existing_dates(
                db.query(models.Goal.date).filter(models.Goal.user_id == user_id).all()
            )

            vitals_rows = []
            lifestyle_rows = []
            activity_rows = []
            academic_rows = []
            goal_rows = []

            for day_index in range(DAYS_TO_SEED):
                record_date = today_date - timedelta(days=(DAYS_TO_SEED - 1 - day_index))
                is_weekend = record_date.weekday() >= 5
                record_datetime = datetime.combine(record_date, datetime.min.time()) + timedelta(
                    hours=rng.randint(6, 10),
                    minutes=rng.randint(0, 59)
                )

                if record_date not in existing_vitals_dates:
                    hr_base = profile["vitals"]["hr"] + (-2 if is_weekend else 0)
                    vitals_rows.append({
                        "user_id": user_id,
                        "ts": record_datetime,
                        "hr": int(clamp(rng.normalvariate(hr_base, 4), 60, 95)),
                        "bp_sys": int(clamp(rng.normalvariate(profile["vitals"]["bp_sys"], 5), 105, 135)),
                        "bp_dia": int(clamp(rng.normalvariate(profile["vitals"]["bp_dia"], 4), 65, 90)),
                        "spo2": int(clamp(rng.normalvariate(profile["vitals"]["spo2"], 1), 95, 100)),
                        "temp": round(clamp(rng.normalvariate(profile["vitals"]["temp"], 0.2), 97.6, 99.2), 1),
                    })

                if record_date not in existing_lifestyle_dates:
                    sleep_base = profile["lifestyle"]["sleep_hrs"] + (0.6 if is_weekend else 0)
                    lifestyle_rows.append({
                        "user_id": user_id,
                        "date": record_date,
                        "sleep_hrs": round(clamp(rng.normalvariate(sleep_base, 0.5), 5.5, 9.5), 1),
                        "stress_score": int(clamp(rng.normalvariate(profile["lifestyle"]["stress_score"], 1), 1, 7)),
                        "water_glasses": int(clamp(rng.normalvariate(profile["lifestyle"]["water_glasses"], 2), 4, 12)),
                        "diet_score": int(clamp(rng.normalvariate(profile["lifestyle"]["diet_score"], 1), 1, 5)),
                    })

                if record_date not in existing_academic_dates:
                    study_base = profile["academic"]["study_hrs"] + (-1.0 if is_weekend else 0)
                    academic_rows.append({
                        "user_id": user_id,
                        "date": record_date,
                        "study_hrs": round(clamp(rng.normalvariate(study_base, 0.8), 0.5, 7.0), 1),
                        "attendance_pct": int(clamp(rng.normalvariate(profile["academic"]["attendance_pct"], 5), 80, 100)),
                        "assignments_on_time": int(clamp(rng.normalvariate(profile["academic"]["assignments_on_time"], 1), 0, 5)),
                    })

                if record_date not in existing_activity_dates:
                    steps_base = profile["activity"]["steps"] + (1200 if is_weekend else 0)
                    activity_rows.append({
                        "user_id": user_id,
                        "date": record_date,
                        "steps": int(clamp(rng.normalvariate(steps_base, 1200), 2500, 14000)),
                        "exercise_mins": int(clamp(rng.normalvariate(profile["activity"]["exercise_mins"], 10), 10, 75)),
                    })

                if record_date not in existing_goal_dates:
                    goal_text = profile["goals"][day_index % len(profile["goals"])]
                    completed_cutoff = today_date - timedelta(days=2)
                    completed = record_date < completed_cutoff and rng.random() < 0.7
                    goal_rows.append({
                        "user_id": user_id,
                        "date": record_date,
                        "text": goal_text,
                        "completed": completed,
                        "created_at": record_datetime + timedelta(hours=rng.randint(1, 5)),
                    })

            insert_rows(db, models.Vitals.__table__, vitals_rows)
            insert_rows(db, models.Lifestyle.__table__, lifestyle_rows, conflict_cols=["user_id", "date"])
            insert_rows(db, models.Academic.__table__, academic_rows)
            insert_rows(db, models.Activity.__table__, activity_rows, conflict_cols=["user_id", "date"])
            insert_rows(db, models.Goal.__table__, goal_rows)

            db.commit()
            print(f"✅ User {user_id} data seeded successfully!")

        print("\n🎉 Setup Complete! Data generated without overwriting existing records.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    generate_fake_data()
