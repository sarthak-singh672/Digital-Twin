import pandas as pd
import joblib
import os
from pathlib import Path

# Import our own feature engineering functions
from src.core.feature_engineering import generate_all_features

# Import ML models
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

"""
This script trains and serializes (saves) our ML models.
"""

# --- UNIVERSAL PATH LOGIC ---
# This finds the 'Student_DT_Backend' folder regardless of where you run it
current_file = Path(__file__).resolve()
# We look for the folder that contains 'data' and 'src'
PROJECT_ROOT = current_file.parents[0]
if PROJECT_ROOT.name == "core": # If script is in src/core/
    PROJECT_ROOT = PROJECT_ROOT.parent.parent
elif PROJECT_ROOT.name == "src": # If script is in src/
    PROJECT_ROOT = PROJECT_ROOT.parent

# Define paths relative to the real root
MODEL_DIR = PROJECT_ROOT / "src" / "core" / "models"
DATA_PATH = PROJECT_ROOT / "data" / "synthetic_student_data.csv"

# Define features from our other modules
from src.core.anomaly_detection import MODEL_FEATURES as ANOMALY_FEATURES
from src.core.risk_prediction import MODEL_FEATURES as RISK_FEATURES

TARGET_VARIABLE = "academic_risk"

def train():
    print(f"--- Model Training Pipeline ---")
    print(f"Project Root Detected: {PROJECT_ROOT}")
    print(f"Looking for data at: {DATA_PATH}")
    print(f"Models will save to: {MODEL_DIR}")

    # --- 1. Load Data ---
    if not DATA_PATH.exists():
        print(f"\n[ERROR]: Data file not found!")
        print(f"I was looking here: {DATA_PATH}")
        print("ACTION REQUIRED: Please check if your 'data' folder is at the same level as 'src'.")
        return

    try:
        df = pd.read_csv(DATA_PATH)
    except Exception as e:
        print(f"[ERROR]: Could not read CSV: {e}")
        return

    print(f"Successfully loaded {len(df)} records.")

    # --- 2. Feature Engineering ---
    print("Applying feature engineering...")
    df_features = generate_all_features(df)

    # Ensure all features for both models are present
    all_features = list(set(ANOMALY_FEATURES + RISK_FEATURES))
    if not all(col in df_features.columns for col in all_features):
        missing = [col for col in all_features if col not in df_features.columns]
        print(f"[ERROR]: Feature engineering missing columns: {missing}")
        return

    print("Feature engineering complete.")

    # --- 3. Train Anomaly Detection Model ---
    print("Training Anomaly Detection model...")
    X_anomaly = df_features[ANOMALY_FEATURES].dropna()
    model_iso = IsolationForest(contamination=0.1, random_state=42)
    model_iso.fit(X_anomaly)

    # --- 4. Train Risk Prediction Model ---
    print("Training Academic Risk model...")
    df_train = df_features[RISK_FEATURES + [TARGET_VARIABLE]].dropna()
    X = df_train[RISK_FEATURES]
    y = df_train[TARGET_VARIABLE]

    if len(X) == 0:
        print("[ERROR]: No data available for training risk model after cleaning NaNs.")
        return

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model_rf = RandomForestClassifier(n_estimators=100, random_state=42)
    model_rf.fit(X_train, y_train)

    # Evaluate
    y_pred = model_rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nRandomForest Model Accuracy: {acc * 100:.2f}%")

    # --- 5. Save Models ---
    print("Saving models to disk...")
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model_iso, MODEL_DIR / "isolation_forest.joblib")
    joblib.dump(model_rf, MODEL_DIR / "risk_model.joblib")

    print(f"Saved to: {MODEL_DIR}")
    print("\n--- Training Complete! ---")

if __name__ == "__main__":
    train()