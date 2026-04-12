# Digital Twin (FastAPI + Frontend)

This project is deployed as a **single FastAPI web app** that serves:
- API at `/api/v1/...`
- Frontend static files at `/frontend/...`
- Root redirect `/` → `/frontend/login.html`

## Deploy on Railway / Render / Fly.io

1. Connect this GitHub repository to your hosting platform.
2. Create a PostgreSQL database on the same platform.
3. Configure build and start:
   - Build/install: `pip install -r requirements.txt`
   - Start: `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables:
   - `DATABASE_URL` (your hosted Postgres URL)
   - `SECRET_KEY` (strong random value)
   - `ALGORITHM=HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES=30`
5. Deploy.

## Frontend API Configuration

Frontend API calls default to same-origin:
- `${window.location.origin}/api/v1`

Optional override (before loading app scripts):
- `window.DIGITAL_TWIN_API_BASE_URL = "https://your-domain/api/v1"`

## Post-deploy checks

1. Open `/` and confirm it redirects to login page.
2. Register and log in.
3. Submit data from manual entry pages.
4. Verify dashboard/profile/analytics load backend data.
5. Confirm database records are written.
