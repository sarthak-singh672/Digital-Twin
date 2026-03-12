import random
from datetime import datetime, timedelta

from src.db.database import SessionLocal
from src.db import models

# User IDs update karein agar aapke pass alag hain
USER_IDS = [7, 8]
DAYS_TO_SEED = 30

def generate_fake_data():
    db = SessionLocal()
    try:
        today_datetime = datetime.now()

        for user_id in USER_IDS:
            print(f"🚀 Generating 30 days of data for User ID: {user_id}...")

            for i in range(DAYS_TO_SEED):
                record_datetime = today_datetime - timedelta(days=(DAYS_TO_SEED - i))
                record_date = record_datetime.date()

                # 1. Vitals Data (Using real column names: hr, bp_sys, bp_dia, spo2, temp)
                vital = models.Vitals(
                    user_id=user_id,
                    ts=record_datetime,
                    hr=random.randint(70, 85),
                    bp_sys=random.randint(115, 125),
                    bp_dia=random.randint(75, 80),
                    spo2=random.randint(97, 99),
                    temp=round(random.uniform(98.0, 98.6), 1)
                )
                db.add(vital)

                # 2. Lifestyle Data (Real names: sleep_hrs, stress_score, diet_score)
                existing_lifestyle = db.query(models.Lifestyle).filter(
                    models.Lifestyle.user_id == user_id,
                    models.Lifestyle.date == record_date
                ).first()

                if not existing_lifestyle:
                    lifestyle = models.Lifestyle(
                        user_id=user_id,
                        date=record_date,
                        sleep_hrs=round(random.uniform(7.0, 8.5), 1),
                        stress_score=random.randint(2, 5), # Normal stress levels
                        water_glasses=random.randint(8, 12),
                        diet_score=random.randint(3, 5) # 1-5 scale range
                    )
                    db.add(lifestyle)

                # 3. Academic Data (Real names: study_hrs, attendance_pct)
                existing_academic = db.query(models.Academic).filter(
                    models.Academic.user_id == user_id,
                    models.Academic.date == record_date
                ).first()

                if not existing_academic:
                    academic = models.Academic(
                        user_id=user_id,
                        date=record_date,
                        study_hrs=round(random.uniform(3.0, 6.0), 1),
                        attendance_pct=random.randint(85, 100),
                        assignments_on_time=random.randint(1, 5)
                    )
                    db.add(academic)

                # 4. Activity Data (Real names: steps, exercise_mins)
                existing_activity = db.query(models.Activity).filter(
                    models.Activity.user_id == user_id,
                    models.Activity.date == record_date
                ).first()

                if not existing_activity:
                    activity = models.Activity(
                        user_id=user_id,
                        date=record_date,
                        steps=random.randint(5000, 10000),
                        exercise_mins=random.randint(20, 45) # Backend will convert to hrs
                    )
                    db.add(activity)

            db.commit()
            print(f"✅ User {user_id} data seeded successfully!")

        print("\n🎉 Setup Complete! Saara data AI logic ke sath sync ho chuka hai.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    generate_fake_data()