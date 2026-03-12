// Digital Twin - Backend API Configuration

const API_CONFIG = {
    BASE_URL: 'http://127.0.0.1:8000/api/v1', // <-- Pointed to your local FastAPI backend
    ENDPOINTS: {
        SIGNUP: '/auth/register', // <-- Updated to match FastAPI
        LOGIN: '/auth/token',     // <-- Updated to match FastAPI
        PROFILE: '/auth/profile',
        TOKEN_REFRESH: '/auth/token',
        VITALS: '/data/vitals',       // <-- Updated to match FastAPI
        LIFESTYLE: '/data/lifestyle', // <-- Updated to match FastAPI
        ACADEMIC: '/data/academic',   // <-- Updated to match FastAPI
        GOALS: '/goals/',
        GOALS_ACTIVE: '/goals/active/',
        ACHIEVEMENTS: '/achievements/',
        EXPORTS: '/exports/',
        ANALYTICS_SUMMARY: '/analytics/summary' // <-- Updated to match FastAPI
    }
};

class API {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    getToken() {
        return localStorage.getItem('access_token');
    }

    setTokens(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    }

    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    }

    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(options.auth !== false),
                    ...options.headers
                }
            });

            if (response.status === 401 && options.auth !== false) {
                this.clearTokens();
                window.location.href = '/login.html';
                throw new Error('Session expired');
            }

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || data?.detail || 'Request failed');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async signup(userData) {
        const data = await this.request(API_CONFIG.ENDPOINTS.SIGNUP, {
            method: 'POST',
            auth: false,
            body: JSON.stringify(userData)
        });
        return data;
    }

    async login(credentials) {
        // FastAPI uses OAuth2 which requires URL Encoded form data for login
        const formData = new URLSearchParams();
        // Frontend might send 'email', but FastAPI expects the field to be called 'username'
        formData.append('username', credentials.email || credentials.username);
        formData.append('password', credentials.password);

        const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.LOGIN}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        // FastAPI returns access_token directly
        if (data.access_token) {
            this.setTokens(data.access_token, data.access_token);
            localStorage.setItem('user_data', JSON.stringify({email: credentials.email}));
        }
        return data;
    }

    async getProfile() {
        return this.request(API_CONFIG.ENDPOINTS.PROFILE);
    }

    async updateProfile(updates) {
        return this.request(API_CONFIG.ENDPOINTS.PROFILE, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    logout() {
        this.clearTokens();
        window.location.href = '/login.html';
    }

    async createVital(vitalData) {
        return this.request(API_CONFIG.ENDPOINTS.VITALS, {
            method: 'POST',
            body: JSON.stringify(vitalData)
        });
    }

    async getVitals(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `${API_CONFIG.ENDPOINTS.VITALS}?${queryString}` : API_CONFIG.ENDPOINTS.VITALS;
        return this.request(endpoint);
    }

    async createLifestyle(lifestyleData) {
        return this.request(API_CONFIG.ENDPOINTS.LIFESTYLE, {
            method: 'POST',
            body: JSON.stringify(lifestyleData)
        });
    }

    async getLifestyle(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `${API_CONFIG.ENDPOINTS.LIFESTYLE}?${queryString}` : API_CONFIG.ENDPOINTS.LIFESTYLE;
        return this.request(endpoint);
    }

    async createAcademic(academicData) {
        return this.request(API_CONFIG.ENDPOINTS.ACADEMIC, {
            method: 'POST',
            body: JSON.stringify(academicData)
        });
    }

    async getAcademic(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `${API_CONFIG.ENDPOINTS.ACADEMIC}?${queryString}` : API_CONFIG.ENDPOINTS.ACADEMIC;
        return this.request(endpoint);
    }

    async createGoal(goalData) {
        return this.request(API_CONFIG.ENDPOINTS.GOALS, {
            method: 'POST',
            body: JSON.stringify(goalData)
        });
    }

    async getGoals(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `${API_CONFIG.ENDPOINTS.GOALS}?${queryString}` : API_CONFIG.ENDPOINTS.GOALS;
        return this.request(endpoint);
    }

    async getActiveGoals() {
        return this.request(API_CONFIG.ENDPOINTS.GOALS_ACTIVE);
    }

    async updateGoal(id, updates) {
        return this.request(`${API_CONFIG.ENDPOINTS.GOALS}${id}/`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteGoal(id) {
        return this.request(`${API_CONFIG.ENDPOINTS.GOALS}${id}/`, {
            method: 'DELETE'
        });
    }

    async getAnalyticsSummary(days = 30) {
        return this.request(`${API_CONFIG.ENDPOINTS.ANALYTICS_SUMMARY}?days=${days}`);
    }

    async submitHealthData(data) {
        try {
            const results = {};
            if (data.vitals) results.vitals = await this.createVital(data.vitals);
            if (data.lifestyle) results.lifestyle = await this.createLifestyle(data.lifestyle);
            if (data.academic) results.academic = await this.createAcademic(data.academic);
            return results;
        } catch (error) {
            console.error('Error submitting health data:', error);
            throw error;
        }
    }
}

window.DigitalTwinAPI = new API();
window.DigitalTwinAPI.isAuthenticated = function() {
    return !!this.getToken();
};
window.DigitalTwinAPI.protectPage = function() {
    if (!this.isAuthenticated()) {
        window.location.href = '/login.html';
    }
};