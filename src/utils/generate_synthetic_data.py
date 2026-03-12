import pandas as pd
import numpy as np
import os

"""
This script generates a synthetic dataset of 500 student records
and saves it to 'data/synthetic_student_data.csv'.
"""

NUM_RECORDS = 500
OUTPUT_PATH = "data/synthetic_student_data.csv"

def generate_data():
    print(f"Generating {NUM_RECORDS} synthetic records...")

    # Create a base date range
    dates = pd.date_range(end='2025-10-30', periods=NUM_RECORDS, freq='D')

    # Create base data
    data = {
        'date': dates,
        'hr': np.random.normal(loc=75, scale=10, size=NUM_RECORDS),
        'temp': np.random.normal(loc=36.8, scale=0.4, size=NUM_RECORDS),

        # Base lifestyle data
        'sleep_hrs': np.random.normal(loc=7, scale=1.5, size=NUM_RECORDS),
        'stress_score': np.random.randint(1, 10, size=NUM_RECORDS),

        # 🚀 THE FIX: Replaced 'steps' with 'exercise_mins' to match your frontend!
        'exercise_mins': np.random.randint(0, 120, size=NUM_RECORDS),

        # Base academic data
        'study_hrs': np.random.normal(loc=3, scale=2, size=NUM_RECORDS),
        'attendance_pct': np.random.normal(loc=85, scale=10, size=NUM_RECORDS),
    }

    df = pd.DataFrame(data)

    # --- Create the Target Variable ('academic_risk') ---
    # We will "correlate" the risk with the features to make it learnable.
    # Risk increases with high stress, low sleep, and low study hours.

    # Normalize features to 0-1 range for scoring
    stress_norm = (df['stress_score'] - 1) / 9
    sleep_norm = 1 - (df['sleep_hrs'] / 10)  # Invert: less sleep = higher risk
    study_norm = 1 - (df['study_hrs'] / 8)  # Invert: less study = higher risk

    # Calculate a risk score
    risk_score = (stress_norm * 0.4) + (sleep_norm * 0.3) + (study_norm * 0.3)

    # Add some random noise
    risk_score += np.random.normal(0, 0.1, size=NUM_RECORDS)

    # Create the binary target variable
    df['academic_risk'] = (risk_score > 0.6).astype(int)

    # --- Clean up data (clipping) ---
    df['sleep_hrs'] = df['sleep_hrs'].clip(0, 16)
    df['study_hrs'] = df['study_hrs'].clip(0, 10)
    df['attendance_pct'] = df['attendance_pct'].clip(0, 100)
    df['hr'] = df['hr'].clip(50, 120)
    df['temp'] = df['temp'].clip(35, 40)

    # Ensure data directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    # Save to CSV
    df.to_csv(OUTPUT_PATH, index=False)

    print(f"✅ Successfully generated data and saved to {OUTPUT_PATH}.")
    print("\nData preview:")
    print(df.head())
    print(f"\nRisk distribution:\n{df['academic_risk'].value_counts(normalize=True)}")

if __name__ == "__main__":
    generate_data()