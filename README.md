# Digital Twin (FastAPI + Frontend)

This project is deployed as a **single FastAPI web app** that serves:
- API at `/api/v1/...`
- Frontend static files at `/frontend/...`
- Root redirect `/` → `/frontend/login.html`

## Recommended Platform: Railway (FastAPI + Postgres)

Railway is the fastest path for this repo because the backend and frontend are already served from one FastAPI app and Railway provides managed Postgres + simple public domain setup.

## Railway Deployment (Click-by-Click)

### 1) Sign in and connect GitHub
1. Open `https://railway.app`.
2. Click **Login** and choose **GitHub**.
3. Authorize Railway if prompted.

### 2) Create the project from this repository
1. In Railway dashboard, click **New Project**.
2. Click **Deploy from GitHub repo**.
3. Select repository: `sarthak-singh672/Digital-Twin`.
4. Wait for Railway to create your app service.

### 3) Add PostgreSQL in the same project
1. Inside the same Railway project, click **New**.
2. Select **Database** → **PostgreSQL**.
3. Wait until the Postgres service status becomes healthy.

### 4) Configure build and start commands
1. Open the app service created from GitHub (not the Postgres service).
2. Go to **Settings** (or **Deploy**, depending on UI version).
3. Set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
4. Save changes.

### 5) Set required environment variables
1. Open app service → **Variables**.
2. Add:
   - `DATABASE_URL` = Postgres connection URL from Railway
   - `SECRET_KEY` = long random string (required for production)
   - `ALGORITHM` = `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `30`
3. Save variables.

### 6) Redeploy
1. Trigger a deploy/redeploy from Railway UI.
2. Wait until deployment is healthy.
3. Check logs for startup success (uvicorn running, no config errors).

### 7) Generate your live public URL
1. Open app service → **Settings** → **Networking**.
2. Click **Generate Domain** (or **Public Domain**).
3. Copy URL (example: `https://your-app.up.railway.app`).

## Frontend API Configuration

Frontend API calls default to same-origin:
- `${window.location.origin}/api/v1`

Optional override (before loading app scripts):
- `window.DIGITAL_TWIN_API_BASE_URL = "https://your-domain/api/v1"`

## Post-deploy checks

1. Open `https://your-app.up.railway.app/` and confirm redirect to `/frontend/login.html`.
2. Register and log in.
3. Submit entries from manual-entry pages.
4. Verify dashboard, profile, and analytics load backend data.
5. Confirm records are saved in Railway Postgres.

## Custom Domain (Optional)

1. Buy/use a domain from your registrar.
2. In Railway app service → **Networking**, click **Custom Domain**.
3. Add your domain and copy Railway-provided DNS records.
4. Add the same DNS records at your registrar (usually CNAME).
5. Wait for DNS propagation and SSL issuance.

## Browser and Google Search Visibility

- You can open your Railway URL directly in Chrome immediately.
- Google search indexing is not immediate.
- For faster indexing, submit your domain in Google Search Console and request indexing.
