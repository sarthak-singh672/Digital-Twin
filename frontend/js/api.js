// Digital Twin - API Service Logic (Unified & Fixed)

(function(window) {
    'use strict';

    const defaultBaseUrl = `${window.location.origin}/api/v1`;
    const API_CONFIG = {
        BASE_URL: (window.DIGITAL_TWIN_API_BASE_URL || defaultBaseUrl).replace(/\/$/, ''),
        ENDPOINTS: {
            SIGNUP: '/auth/register',
            LOGIN: '/auth/token',
            PROFILE: '/users/me',
            STATS: '/profile/stats'
        }
    };
    var apiBaseUrl = API_CONFIG.BASE_URL;
    window.BASE_URL = window.BASE_URL || apiBaseUrl;

    function getToken() {
        return localStorage.getItem('access_token');
    }

    function saveToken(token) {
        localStorage.setItem('access_token', token);
    }

    function logout() {
        localStorage.removeItem('access_token');
        window.location.href = 'login.html';
    }

    function isAuthenticated() {
        return !!getToken();
    }

    function ensureLimit(val) {
        if (typeof val === 'number') return val;
        if (typeof val === 'object' && val !== null && val.limit) return val.limit;
        return 30;
    }

    async function authedFetch(url, options = {}) {
        const token = getToken();
        if (!token) {
            console.error("Auth Token missing!");
            logout();
            throw new Error("Session expired. Please log in again.");
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });
        return await handleResponse(response);
    }

    async function handleResponse(response) {
        if (response.status === 204) return { status: "success" };

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`Server Error: ${response.status}`);
        }

        if (!response.ok) {
            if (response.status === 401) logout();
            throw new Error(data.detail || `Error ${response.status}`);
        }
        return data;
    }

    // --- API METHODS ---

    window.DigitalTwinAPI = {
        baseURL: apiBaseUrl,
        isAuthenticated,
        logout,
        getToken,

        async login({ username, password }) {
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            const response = await fetch(`${apiBaseUrl}/auth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            const data = await handleResponse(response);
            if (data.access_token) saveToken(data.access_token);
            return data;
        },

        async signup(userData) {
            const response = await fetch(`${apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            await handleResponse(response);
            return this.login({ username: userData.email, password: userData.password });
        },

        // --- Data Submission ---
        async submitVitals(data) {
            return authedFetch(`${apiBaseUrl}/data/vitals`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async submitLifestyle(data) {
            return authedFetch(`${apiBaseUrl}/data/lifestyle`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async submitAcademic(data) {
            return authedFetch(`${apiBaseUrl}/data/academic`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async submitActivity(data) {
            return authedFetch(`${apiBaseUrl}/data/activity`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        // --- Retrieval ---
        async getProfile() {
            return authedFetch(`${apiBaseUrl}/users/me`);
        },

        async getAnalyticsSummary() {
            return authedFetch(`${apiBaseUrl}/analytics/summary`);
        },

        async getVitals(limit) {
            const cleanLimit = ensureLimit(limit);
            return authedFetch(`${apiBaseUrl}/data/vitals?limit=${cleanLimit}`);
        },

        async getLifestyle(limit) {
            const cleanLimit = ensureLimit(limit);
            return authedFetch(`${apiBaseUrl}/data/lifestyle?limit=${cleanLimit}`);
        },

        async getAcademic(limit) {
            const cleanLimit = ensureLimit(limit);
            return authedFetch(`${apiBaseUrl}/data/academic?limit=${cleanLimit}`);
        },

        async getActiveGoals() {
            try {
                return await authedFetch(`${apiBaseUrl}/goals/active`);
            } catch (e) {
                return [];
            }
        },                                                         // ✅ ADDED COMMA HERE

        // ✅ NEW: Get Activity data (for loading Physical Activity on form)
        async getActivity(limit) {
            const cleanLimit = ensureLimit(limit);
            return authedFetch(`${apiBaseUrl}/data/activity?limit=${cleanLimit}`);
        }                                                          // ✅ LAST METHOD — NO COMMA
    };

})(window);
