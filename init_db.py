import pandas as pd
from datetime import datetime, timedelta
from src.db.database import engine, SessionLocal
from src.db.models import Base, User, Vitals, Lifestyle, Activity, Academic


def init_db():
    print("Creating tables...")
    # This creates all the tables based on your models.py
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Create the Test User
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(email="test@example.com", username="testuser", hashed_password="hashed_password_here")
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created user: {user.email} with ID {user.user_id}")

        # 2. Check if we already seeded to prevent duplicating data
        existing_data = db.query(Lifestyle).filter(Lifestyle.user_id == user.user_id).first()
        if existing_data:
            print("Data is already seeded! You are good to go.")
            return

        # 3. Read the CSV and seed the data
        print("Seeding history from CSV into your new tables...")
        df = pd.read_csv("data/synthetic_student_data.csv")

        for i, row in df.iterrows():
            # Generate a sequence of dates ending today
            dt_obj = datetime.now() - timedelta(days=(len(df) - i))
            date_obj = dt_obj.date()

            # Vitals (Requires DateTime)
            db.add(Vitals(user_id=user.user_id, ts=dt_obj, hr=row['hr'], temp=row['temp']))

            # Lifestyle (Requires Date)
            db.add(Lifestyle(user_id=user.user_id, date=date_obj, sleep_hrs=row['sleep_hrs'],
                             stress_score=row['stress_score']))

            # Activity (Requires Date)
            db.add(Activity(user_id=user.user_id, date=date_obj, steps=row['steps']))

            # Academic (Requires Date)
            db.add(Academic(user_id=user.user_id, date=date_obj, study_hrs=row['study_hrs'],
                            attendance_pct=row['attendance_pct']))

        db.commit()
        print(f"Success! Seeded {len(df)} days of history across all tables for {user.email}")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()