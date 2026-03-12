import pandas as pd
import numpy as np

def generate_all_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Main wrapper updated with REAL DB NAMES.
    Fixes applied: Deduplication for Date axis & Scaled formulas for 0-10 Graphs.
    """
    if df.empty:
        return df

    df_features = df.copy()

    # 1. Date Indexing & 🚀 FIX 1: DEDUPLICATION (Purana kachra saaf!)
    if 'date' in df_features.columns:
        df_features['date'] = pd.to_datetime(df_features['date']).dt.normalize() # Sirf date rakhega, time hata dega
        # Sort karke duplicate dates ko hata dein, sirf latest (last) entry rakhein
        df_features = df_features.sort_values('date').drop_duplicates(subset=['date'], keep='last')

    # Convert exercise_mins to activity_hrs
    if 'exercise_mins' in df_features.columns:
        df_features['activity_hrs'] = pd.to_numeric(df_features['exercise_mins'], errors='coerce').fillna(0) / 60
    elif 'activity_hrs' not in df_features.columns:
        df_features['activity_hrs'] = 0.0

    # 2. Rolling Features (7-day window)
    cols_to_roll = ['hr', 'temp', 'sleep_hrs', 'stress_score', 'study_hrs', 'diet_score', 'activity_hrs']

    df_features = df_features.set_index('date')

    for col in cols_to_roll:
        if col in df_features.columns:
            df_features[col] = pd.to_numeric(df_features[col], errors='coerce')
            df_features[f'{col}_mean_7d'] = df_features[col].rolling(window=7, min_periods=1).mean()
            df_features[f'{col}_std_7d'] = df_features[col].rolling(window=7, min_periods=1).std().fillna(0)

    # 3. Composite Indices
    stress_mean = df_features.get('stress_score_mean_7d', 0)
    sleep_mean = df_features.get('sleep_hrs_mean_7d', 7)
    study_mean = df_features.get('study_hrs_mean_7d', 0)

    # 🚀 NEW: Strain vs Productivity Logic (Flow State vs Burnout)
    sleep_penalty = np.maximum(0, 8 - sleep_mean)

    # If stress is high (>6), studying adds to burnout (positive penalty)
    # If stress is low (<=6), studying is productive/flow state (negative penalty / bonus)
    study_impact = np.where(stress_mean > 6.0, study_mean * 0.2, -study_mean * 0.1)

    df_features['StressIndex'] = (stress_mean * 0.7) + (sleep_penalty * 0.5) + study_impact
    df_features['StressIndex'] = df_features['StressIndex'].clip(lower=0, upper=10)

    # EngagementScore
    if 'study_hrs_mean_7d' in df_features.columns and 'attendance_pct' in df_features.columns:
        study_norm = (df_features['study_hrs_mean_7d'] / 8) * 100
        attendance = pd.to_numeric(df_features['attendance_pct'], errors='coerce').fillna(80)
        df_features['EngagementScore'] = (study_norm * 0.5) + (attendance * 0.5)


    # 🚀 FIX 3: Wellness Score calculation ko realistic banaya
    activity = df_features.get('activity_hrs_mean_7d', 0)
    diet = df_features.get('diet_score_mean_7d', 5)

    # Wellness base is 10. Subtract Stress. Add bonuses for good habits.
    df_features['WellnessScore'] = 10 - df_features['StressIndex'] + (activity * 1.5) + (diet * 0.2) + (sleep_mean * 0.3)
    df_features['WellnessScore'] = df_features['WellnessScore'].clip(lower=0, upper=10)

    # 4. Safety Net: Fill Missing ML Columns
    # 4. Safety Net: Fill Missing ML Columns
    required = [
        'hr_mean_7d', 'sleep_hrs_mean_7d',
        'study_hrs_mean_7d', 'temp_mean_7d', 'StressIndex',
        'EngagementScore', 'WellnessScore', 'activity_hrs_mean_7d'
    ]
    for col in required:
        if col not in df_features.columns:
            df_features[col] = 0.0

    return df_features.reset_index().ffill().bfill()