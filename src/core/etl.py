import pandas as pd
from sqlalchemy.orm import Session
from src.db import models

"""
This module is responsible for the 'E' (Extract) and 'T' (Transform)
in ETL.
"""


def get_user_data(db: Session, user_id: int) -> pd.DataFrame:
    """
    Fetches all data for a single user and combines it into one DataFrame.
    """

    # Query for all data points for the user
    query_vitals = db.query(models.Vitals).filter(models.Vitals.user_id == user_id)
    query_lifestyle = db.query(models.Lifestyle).filter(models.Lifestyle.user_id == user_id)
    query_academic = db.query(models.Academic).filter(models.Academic.user_id == user_id)
    query_activity = db.query(models.Activity).filter(models.Activity.user_id == user_id)

    # Read data into pandas DataFrames
    df_vitals = pd.read_sql(query_vitals.statement, query_vitals.session.bind)
    df_lifestyle = pd.read_sql(query_lifestyle.statement, query_lifestyle.session.bind)
    df_academic = pd.read_sql(query_academic.statement, query_academic.session.bind)
    df_activity = pd.read_sql(query_activity.statement, query_activity.session.bind)

    if df_lifestyle.empty and df_academic.empty and df_activity.empty:
        if not df_vitals.empty:
            df_vitals['date'] = pd.to_datetime(df_vitals['ts']).dt.date
            return df_vitals.sort_values(by='date')
        return pd.DataFrame()

        # --- Data Merging ---
    if not df_lifestyle.empty:
        df_lifestyle['date'] = pd.to_datetime(df_lifestyle['date'])
    if not df_academic.empty:
        df_academic['date'] = pd.to_datetime(df_academic['date'])
    if not df_activity.empty:
        df_activity['date'] = pd.to_datetime(df_activity['date'])

    if not df_lifestyle.empty and not df_activity.empty:
        df_base = pd.merge(df_lifestyle, df_activity, on=['user_id', 'date'], how='outer')
    elif not df_lifestyle.empty:
        df_base = df_lifestyle
    else:
        df_base = df_activity

    if not df_academic.empty:
        if 'date' in df_base.columns:
            df_base = pd.merge(df_base, df_academic, on=['user_id', 'date'], how='outer')
        else:
            df_base = df_academic

    # --- Handle Vitals (which have timestamps, not dates) ---
    if not df_vitals.empty:
        df_vitals['date'] = pd.to_datetime(df_vitals['ts']).dt.date
        df_vitals_agg = df_vitals.groupby('date').agg(
            # Renamed to 'hr' and 'temp' to match synthetic data
            hr=('hr', 'mean'),
            hr_max=('hr', 'max'),
            temp=('temp', 'mean')
        ).reset_index()

        df_vitals_agg['date'] = pd.to_datetime(df_vitals_agg['date'])

        df_base = pd.merge(df_base, df_vitals_agg, on='date', how='left')

    df_base = df_base.sort_values(by='date')

    # --- Data Cleaning (as mentioned in paper) ---
    df_base = df_base.ffill()

    if 'temp' in df_base.columns:
        df_base['temp'] = df_base['temp'].clip(34, 42)  # Renamed from 'temp_mean'

    return df_base