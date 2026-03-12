import pandas as pd
import joblib
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "isolation_forest.joblib"
MODEL_FEATURES = ['hr_mean_7d', 'sleep_hrs_mean_7d', 'StressIndex', 'study_hrs_mean_7d', 'activity_hrs_mean_7d']


def run_anomaly_detection(df: pd.DataFrame) -> list:
    """Detects unusual health patterns."""
    if df.empty: return []

    alerts = []
    latest = df.iloc[-1]

    # Rule-Based Checks
    if latest.get('hr_mean_7d', 0) > 100: alerts.append("High Heart Rate Pattern")
    if latest.get('sleep_hrs_mean_7d', 8) < 5: alerts.append("Severe Sleep Deprivation")

    # ML Model-Based Checks
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            model_input = df.iloc[-1:][MODEL_FEATURES]
            if model.predict(model_input)[0] == -1:
                alerts.append("AI Alert: Unusual Activity/Stress Pattern Detected")
        except Exception as e:
            print(f"Anomaly Model Error: {e}")

    return alerts