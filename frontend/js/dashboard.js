// Digital Twin - AI Powered Dashboard logic
class DashboardManager {
    constructor() {
        this.charts = {};
        this.userData = null;
        this.vitalsData = [];
        this.analyticsSummary = null;
        this.init();
    }

    async init() {
        if (!window.DigitalTwinAPI || !window.DigitalTwinAPI.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        this.setupEventListeners();
        await this.loadUserProfile();
        await this.loadDashboardData();
    }

    setupEventListeners() {
        const vRange = document.getElementById('vitalsTimeRange');
        const lRange = document.getElementById('lifestyleTimeRange');
        if (vRange) vRange.addEventListener('change', () => this.updateVitalsChart(parseInt(vRange.value)));
        if (lRange) lRange.addEventListener('change', () => this.updateLifestyleChart(parseInt(lRange.value)));
    }

    async loadUserProfile() {
        try {
            this.userData = await window.DigitalTwinAPI.getProfile();
            if (document.getElementById('userName') && this.userData) {
                document.getElementById('userName').textContent = `${this.userData.first_name || 'Student'}`;
            }
        } catch (e) { console.error('Profile Error', e); }
    }

    async loadDashboardData() {
        try {
            this.toggleStatus(true);
            const summary = await window.DigitalTwinAPI.getAnalyticsSummary(30).catch(() => ({}));

            renderAIInsights(summary.recommendations);

            // ✅ FIX: Load goals from GOALS API (not recommendations)
            await loadAndRenderDashboardGoals();

            this.analyticsSummary = summary;
            this.vitalsData = summary.chart_data || [];
            this.updateStatsUI(summary);
            this.renderCharts();
            this.toggleStatus(false);
        } catch (e) {
            console.error('Dashboard Data Error', e);
            this.toggleStatus(false, true);
        }
    }

    updateVitalsChart(days) {
        const data = this.filterData(this.vitalsData, days);
        if(!data.length) return;
        const labels = data.map(d => new Date(d.date).toLocaleDateString('en-US', {month:'short', day:'numeric'}));
        const hrValues = data.map(d => d.hr || 0);
        const hrTrend = data.map(d => d.hr_mean_7d || 0);
        const ctx = document.getElementById('vitalsChart');
        if (this.charts.vitals) this.charts.vitals.destroy();
        this.charts.vitals = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Real-time Heart Rate', data: hrValues, borderColor: '#3b82f6',
                        pointBackgroundColor: hrValues.map(v => v > 100 ? '#ef4444' : (v < 60 ? '#f59e0b' : '#10b981')),
                        pointRadius: 6, tension: 0.1, showLine: false
                    },
                    {
                        label: '7-Day Trend', data: hrTrend, borderColor: '#94a3b8',
                        borderDash: [5, 5], fill: false, pointRadius: 0, tension: 0.4
                    }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

   updateLifestyleChart(days) {
        const data = this.filterData(this.analyticsSummary?.chart_data || [], days);
        if(!data.length) return;

        const labels = data.map(d => new Date(d.date).toLocaleDateString('en-US', {month:'short', day:'numeric'}));
        const stress = data.map(d => d.StressIndex || d.stress_score || 0);
        // 🚀 FIX: Pulling sleep data instead of the mirrored wellness score
        const sleep = data.map(d => d.sleep_hrs || 0);

        const ctx = document.getElementById('lifestyleChart');
        if (this.charts.lifestyle) this.charts.lifestyle.destroy();

        this.charts.lifestyle = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Stress Index',
                        data: stress,
                        borderColor: '#ef4444',
                        backgroundColor: '#ef4444',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: false // 🚀 FIX: Removed the muddy background
                    },
                    {
                        label: 'Sleep Hours', // 🚀 FIX: Swapped Wellness for Sleep
                        data: sleep,
                        borderColor: '#8b5cf6', // Matching purple color
                        backgroundColor: '#8b5cf6',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: false // 🚀 FIX: Removed the muddy background
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 12 } } // Bumped max to 12 for healthy sleep hours!
            }
        });
    }

    updateStatsUI(s) {
        // Update the average stats cards
        if(document.getElementById('avgHeartRate')) document.getElementById('avgHeartRate').textContent = s?.vitals?.avg_heart_rate?.toFixed(1) || '--';
        if(document.getElementById('avgSleep')) document.getElementById('avgSleep').textContent = s?.lifestyle?.avg_sleep?.toFixed(1) || '--';
        if(document.getElementById('avgStress')) document.getElementById('avgStress').textContent = s?.lifestyle?.avg_stress?.toFixed(1) || '--';
        if(document.getElementById('avgStudyHours')) document.getElementById('avgStudyHours').textContent = s?.academic?.avg_study_hours?.toFixed(1) || '--';

        const score = s?.health_score || 0;
        const scoreEl = document.getElementById('healthScore');

        // Update the main Health Score number and color
        if (scoreEl) {
            scoreEl.textContent = score;
            // SYNCED COLORS: Matches the label logic below
            scoreEl.style.color = score > 75 ? '#10b981' : (score >= 60 ? '#f59e0b' : '#ef4444');
        }

        // 🚀 THE FIX: Applied your calibrated 3-tier logic here
        const riskLabelEl = document.getElementById('riskLabel');
        if (riskLabelEl) {
            const riskContainer = riskLabelEl.parentElement;

            if (score > 75) {
                // Tier 1: 75+
                riskLabelEl.textContent = 'Optimal';
                riskContainer.style.color = '#10b981'; // Green
            } else if (score >= 60 && score <= 75) {
                // Tier 2: 60 - 75
                riskLabelEl.textContent = 'Normal';
                riskContainer.style.color = '#f59e0b'; // Amber/Yellow
            } else {
                // Tier 3: Under 60
                riskLabelEl.textContent = 'At Risk';
                riskContainer.style.color = '#ef4444'; // Red
            }
        }

        if(document.getElementById('lastUpdated')) {
            document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
        }
    }

    filterData(data, days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return data.filter(d => new Date(d.date) >= cutoff).sort((a,b) => new Date(a.date) - new Date(b.date));
    }

    renderCharts() {
        this.updateVitalsChart(30);
        this.updateLifestyleChart(30);
    }

    toggleStatus(show, err=false) {
        const el = document.getElementById('lastUpdated');
        if(el) {
            if(show) el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing AI...';
            else if(err) el.innerHTML = '<span style="color:#ef4444;">Sync Error</span>';
        }
    }
   }
// =============================================
// AI INSIGHTS (unchanged)
// =============================================
function renderAIInsights(recommendations) {
    const container = document.getElementById("recommendationsGrid");
    if (!container) return;
    container.innerHTML = "";

    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: var(--bg-secondary); border-radius: 12px; border: 2px dashed var(--border-color);">
                <p style="color: var(--text-muted); margin: 0;">No active AI insights. Your digital twin is stabilizing...</p>
            </div>`;
        return;
    }

    const uniqueRecs = [];
    const seenTitles = new Set();
    recommendations.forEach(rec => {
        if (!seenTitles.has(rec.title)) { uniqueRecs.push(rec); seenTitles.add(rec.title); }
    });

    uniqueRecs.forEach(rec => {
        const causesArray = typeof rec.causes === 'string' ? JSON.parse(rec.causes) : rec.causes;
        const theme = {
            danger: { border: '#ef4444', bg: '#fee2e2', text: '#991b1b', label: '#fecaca' },
            warning: { border: '#f59e0b', bg: '#fef3c7', text: '#92400e', label: '#fde68a' },
            success: { border: '#10b981', bg: '#dcfce7', text: '#065f46', label: '#bbf7d0' },
            info: { border: '#3b82f6', bg: '#dbeafe', text: '#1e40af', label: '#bfdbfe' }
        }[rec.type] || { border: '#4F46E5', bg: '#f3f4f6', text: '#111827', label: '#e0e7ff' };

        container.innerHTML += `
            <div style="background: var(--card-bg); padding: 24px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 6px solid ${theme.border}; display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h4 style="margin: 0; color: var(--text-primary); font-size: 18px; font-weight: 700;">${rec.title}</h4>
                    <span style="background: ${theme.label}; color: ${theme.text}; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase;">${rec.type}</span>
                </div>
                <p style="margin: 0; font-size: 14px; color: var(--text-secondary); line-height: 1.6;">${rec.explanation}</p>
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                    <strong style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Probable Causes:</strong>
                    <ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 13px; color: var(--text-secondary);">
                        ${causesArray.map(c => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}
                    </ul>
                </div>
            </div>`;
    });
}

// =============================================
// ✅ FIX: Load goals from GOALS API (database-backed)
// =============================================
async function loadAndRenderDashboardGoals() {
    const goalsContainer = document.getElementById("goalsGrid");
    if (!goalsContainer) return;

    try {
        // ✅ Fetch real goals from database
        const goalsData = await window.DigitalTwinAPI.getActiveGoals();
        const goals = goalsData.goals || [];
        const activeCount = goalsData.active_count || 0;

        // Update section header with real count
        const headerEl = document.querySelector('.goals-section .section-header h3');
        if (headerEl) {
            headerEl.innerHTML = `<i class="fas fa-bullseye"></i> Health Goals <span style="font-size:0.85rem;color:var(--text-muted);margin-left:8px;">(${activeCount} active)</span>`;
        }

        if (goals.length === 0) {
            goalsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px; background: var(--bg-secondary); border-radius: 12px;">
                    <p style="color: var(--text-muted); margin: 0;">✅ All goals completed! No pending goals.</p>
                </div>`;
            return;
        }

        // ✅ Render each goal with checkbox connected to backend
        goalsContainer.innerHTML = goals.map(goal => {
            const dateLabel = goal.is_today ? 'Today' : goal.date;
            const badgeStyle = goal.is_today
                ? 'background:rgba(16,185,129,0.1);color:#10b981;'
                : 'background:var(--bg-secondary);color:var(--text-muted);';

            return `
                <div style="display:flex;align-items:center;gap:12px;padding:15px;background:var(--card-bg);border-radius:12px;border:1px solid var(--border-color);margin-bottom:10px;transition:all 0.3s;" id="dash-goal-${goal.id}">
                    <input type="checkbox" id="dash-goal-check-${goal.id}"
                        onchange="completeDashboardGoal(${goal.id})"
                        style="width:18px;height:18px;cursor:pointer;accent-color:#10b981;">
                    <label for="dash-goal-check-${goal.id}" style="font-size:14px;color:var(--text-primary);cursor:pointer;flex:1;">
                        ${goal.text}
                    </label>
                    <span style="font-size:0.7rem;padding:2px 8px;border-radius:9999px;${badgeStyle}white-space:nowrap;">
                        ${dateLabel}
                    </span>
                </div>`;
        }).join('');

    } catch (err) {
        console.error('Goals load error:', err);
        goalsContainer.innerHTML = "<p style='color:var(--text-muted);'>Could not load goals.</p>";
    }
}

// =============================================
// ✅ FIX: Complete goal from Dashboard (persists in DB)
// =============================================
async function completeDashboardGoal(goalId) {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/goals/${goalId}/complete`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            const data = await res.json();

            // Animate removal
            const item = document.getElementById(`dash-goal-${goalId}`);
            if (item) {
                item.style.opacity = '0';
                item.style.transform = 'translateX(20px)';
                setTimeout(() => {
                    item.remove();
                    // Check if all goals done
                    const remaining = document.querySelectorAll('[id^="dash-goal-"]:not([id*="check"])');
                    if (remaining.length === 0) {
                        document.getElementById('goalsGrid').innerHTML = `
                            <div style="grid-column:1/-1;text-align:center;padding:30px;background:var(--bg-secondary);border-radius:12px;">
                                <p style="color:var(--text-muted);margin:0;">✅ All goals completed!</p>
                            </div>`;
                    }
                }, 300);
            }

            // ✅ Update header with real count from backend
            const headerEl = document.querySelector('.goals-section .section-header h3');
            if (headerEl) {
                headerEl.innerHTML = `<i class="fas fa-bullseye"></i> Health Goals <span style="font-size:0.85rem;color:var(--text-muted);margin-left:8px;">(${data.active_count} active)</span>`;
            }
        }
    } catch (err) {
        console.error('Error completing goal:', err);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new DashboardManager());