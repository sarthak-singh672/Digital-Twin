// Digital Twin - Data Management (Connected to Real Backend)
class DataManager {
    constructor() {
        // No longer using localStorage for main data, but keeping keys for settings/UI state if needed
        this.storageKeys = {
            settings: 'dt_settings'
        };
        this.init();
    }

    init() {
        if (!this.getSettings()) {
            this.createDefaultSettings();
        }
    }

    createDefaultSettings() {
        const settings = {
            theme: 'ocean',
            notifications: true,
            dataRetention: 365,
            privacyMode: false,
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        this.saveSettings(settings);
    }

    // --- Core API Wrappers (Replacing LocalStorage) ---

    async getHealthData(limit = 30) {
        try {
            // Fetch real data from your FastAPI backend
            const vitalsRes = await window.DigitalTwinAPI.getVitals(limit);
            const lifestyleRes = await window.DigitalTwinAPI.getLifestyle(limit);
            const academicRes = await window.DigitalTwinAPI.getAcademic(limit);

            // Structure it the way the frontend expects, merging by date
            const mergedData = this._mergeDataForFrontend(
                vitalsRes.results || [],
                lifestyleRes.results || [],
                academicRes.results || []
            );
            return mergedData;
        } catch (error) {
            console.error('Error fetching health data from API:', error);
            return [];
        }
    }

    async getAnalyticsSummary() {
         try {
            return await window.DigitalTwinAPI.getAnalyticsSummary();
        } catch (error) {
            console.error('Error fetching analytics summary:', error);
            return null;
        }
    }

    async getUserProfile() {
        try {
            return await window.DigitalTwinAPI.getProfile();
        } catch (error) {
            console.error('Error reading user profile from API:', error);
            return null;
        }
    }

    async getActiveGoals() {
        try {
            return await window.DigitalTwinAPI.getActiveGoals();
        } catch (e) {
            return [];
        }
    }

    // --- Data Transformation Helper ---

    _mergeDataForFrontend(vitals, lifestyle, academic) {
        // This function attempts to bundle the separate DB tables into the single object
        // format that your dashboard charts expect.

        let unifiedData = [];

        // Use vitals as the base timeline since it has exact timestamps
        vitals.forEach(v => {
            const vDate = new Date(v.timestamp).toISOString().split('T')[0];

            // Find corresponding lifestyle and academic for that day
            const l = lifestyle.find(item => item.date === vDate) || {};
            const a = academic.find(item => new Date(item.timestamp).toISOString().split('T')[0] === vDate) || {};

            unifiedData.push({
                id: v.id,
                timestamp: v.timestamp,
                vitals: {
                    heartRate: v.hr || 0,
                    bpSystolic: v.bp_sys || 0,
                    bpDiastolic: v.bp_dia || 0,
                    temperature: v.temp || 0,
                    spo2: v.spo2 || 0
                },
                lifestyle: {
                    sleepHours: l.sleep_hrs || 0,
                    stressLevel: l.stress_score || 0,
                    dietQuality: l.diet_score || 0,
                    waterIntake: l.water_glasses || 0
                },
                academic: {
                    studyHours: a.study_hrs || 0,
                    attendance: a.attendance || 0,
                    focusLevel: a.focus_score || 0
                }
            });
        });

        // Sort by timestamp oldest to newest for charts
        return unifiedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }


    // --- Settings Management (Still fine in LocalStorage) ---
    getSettings() {
        try {
            const settings = localStorage.getItem(this.storageKeys.settings);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            return null;
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKeys.settings, JSON.stringify(settings));
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Initialize data manager
window.DataManager = new DataManager();