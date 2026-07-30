# Digital Twin — AI-Powered Health Analytics Platform

A full-stack platform that models a user's health, lifestyle, and academic productivity as a "digital twin," using machine learning to flag risk patterns and deliver personalized recommendations.

Originated as an academic capstone concept; independently redesigned, built, and deployed into production by me.

## Overview
The platform tracks daily vitals, lifestyle habits, and academic activity, then uses feature engineering and ML models to surface early warning signs — like burnout or academic risk — before they become critical.

## Features
- **Data Entry** — logs vitals (heart rate, BP, temperature, SpO2), lifestyle (sleep, stress, water intake), and academic activity (study hours) through a web interface
- **Feature Engineering** — derives a Stress Index, Wellness Score, and overall Health Score from raw inputs
- **ML-Driven Risk Prediction**
  - Random Forest — classifies academic risk level (Optimal / Normal / At Risk)
  - Isolation Forest — detects anomalies in stress and heart rate to flag potential burnout
- **AI Recommendation Engine** — generates categorized insights (Danger / Warning / Informational) with probable causes and suggested recovery actions
- **Interactive Dashboard & Analytics** — real-time health score, vital trends, lifestyle correlations, and long-term risk tracking with exportable reports (CSV/JSON/PDF)

## Tech stack
`FastAPI` · `PostgreSQL` · `Python` · `React` · `Pandas` · `scikit-learn` · `REST APIs` · `Render` · `Vercel`

## Architecture
1. **Ingest** — user data collected via web-based data entry
2. **Process** — FastAPI backend validates and stores structured data in PostgreSQL
3. **Engineer** — raw inputs transformed into Stress/Wellness/Health scores
4. **Predict** — Random Forest and Isolation Forest models generate risk classifications and anomaly flags
5. **Visualize** — React frontend renders the dashboard and analytics views with real-time insights

## Setup
```bash
git clone https://github.com/sarthak-singh672/Digital-Twin.git
cd Digital-Twin
pip install -r requirements.txt
```
Add to a `.env` file:

## Usage
```bash
uvicorn main:app --reload
```
*(replace with your actual entry-point module)*

## Results
- Designed and deployed an end-to-end ML-powered platform (data → model → deployment), serving 17 REST endpoints to live users
- Consolidated scattered health data sources into a single dashboard with automated ingestion pipelines
- Migrated across deployment platforms (Railway → Render) to maintain uptime and reliability
