import pandas as pd
import joblib
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "risk_model.joblib"
MODEL_FEATURES = ['StressIndex', 'EngagementScore', 'sleep_hrs_mean_7d', 'study_hrs_mean_7d', 'hr_mean_7d',
                  'temp_mean_7d']


def predict_academic_risk(df: pd.DataFrame):
    """Predicts likelihood of health/academic risk (0.0 to 1.0)."""
    if df.empty: return 0.0, "normal"

    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            model_input = df.iloc[-1:][MODEL_FEATURES]

            # Probability for Class 1 (at_risk)
            risk_score = model.predict_proba(model_input)[0][1]
            label = "at_risk" if risk_score > 0.5 else "normal"
            return float(risk_score), label
        except Exception as e:
            print(f"Risk Model Error: {e}")

    return 0.0, "normal"