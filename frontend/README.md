# Digital Twin Frontend - UPDATED VERSION

## What's New in This Version

### ✨ Major Updates:

1. **Login/Signup Page Added**
   - New professional login and signup page
   - Accessible via "Get Started" button on landing page
   - Full form validation
   - Backend API integration

2. **Multiple Data Entry Support**
   - Fixed: No longer auto-redirects after single entry
   - Users can add multiple health records
   - Two action buttons after submission:
     * "Add Another Entry" - Reset form for new data
     * "View Dashboard" - Go to dashboard

3. **Dashboard Now Shows Real Backend Data**
   - Fetches data from Django backend API
   - Displays actual user health records
   - Shows analytics based on real data
   - Personalized recommendations
   - Active goals from backend

4. **Complete Authentication Flow**
   - Login required to access dashboard and data entry
   - JWT token management
   - Automatic token refresh
   - Secure logout

## Files Structure

```
frontend/
├── index.html (updated)
├── login.html (NEW)
├── dashboard.html
├── manual-entry.html
├── profile.html
├── analytics.html
├── about.html
├── css/
│   ├── auth.css (NEW)
│   ├── styles.css
│   ├── dashboard.css
│   ├── components.css
│   ├── forms.css
│   ├── charts.css
│   └── responsive.css
└── js/
    ├── api-config.js (backend connector)
    ├── auth.js (NEW)
    ├── forms.js (UPDATED)
    ├── dashboard.js (UPDATED)
    ├── main.js
    ├── data-manager.js
    └── theme-manager.js
```

## Setup Instructions

1. **Extract this ZIP file**

2. **Ensure Backend is Running**
   - Backend should be running at `http://localhost:8000`
   - If backend runs on different port, update `js/api-config.js`

3. **Start Frontend Server**
   ```bash
   python -m http.server 5500
   ```
   Or use VS Code Live Server

4. **Access the Application**
   - Open: `http://localhost:5500`
   - Click "Get Started"
   - Create account or login
   - Start adding health data!

## User Flow

1. **Landing Page** → Click "Get Started"
2. **Login/Signup Page** → Create account or login
3. **Dashboard** → View your health data and analytics
4. **Data Entry** → Add health records (multiple entries allowed)
5. **Dashboard** → See updated data from backend

## Features

✅ Secure authentication with JWT
✅ Multiple data entry without redirect
✅ Real-time data from backend API
✅ Professional UI/UX
✅ Fully responsive design
✅ Error handling and loading states

## Important Notes

- **Backend Required**: This frontend connects to Django backend API
- **API Configuration**: Check `js/api-config.js` for API endpoints
- **Authentication**: All protected pages require login
- **Data Persistence**: All data saved to PostgreSQL database

## Troubleshooting

**Issue: "Session expired" message**
- Solution: Backend might not be running. Start backend server.

**Issue: Login doesn't work**
- Solution: Check if backend is accessible at `http://localhost:8000`

**Issue: Data not showing on dashboard**
- Solution: Add data via "Data Entry" page first

**Issue: CORS errors**
- Solution: Ensure backend CORS settings allow `http://localhost:5500`

## Support

For backend setup, see the backend README.md in the main project ZIP.

Enjoy your Digital Twin application! 🚀
