/**
 * Theme Loader - Applies saved theme INSTANTLY on every page.
 */
(function() {
    'use strict';

    var savedTheme = localStorage.getItem('dt_theme') || 'ocean';

    document.body.classList.remove('theme-ocean', 'theme-dark', 'theme-sunset', 'theme-forest');
    document.body.classList.add('theme-' + savedTheme);

    var themes = {
        ocean: { primary: '#1e40af', secondary: '#06b6d4', accent: '#10b981', background: '#f8fafc', cardBg: '#ffffff', textPrimary: '#1e293b', textSecondary: '#64748b', borderColor: '#e2e8f0', bgSecondary: '#f1f5f9' },
        dark: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#10b981', background: '#0f172a', cardBg: '#1e293b', textPrimary: '#f8fafc', textSecondary: '#cbd5e1', borderColor: '#475569', bgSecondary: '#334155' },
        sunset: { primary: '#7c3aed', secondary: '#f59e0b', accent: '#ec4899', background: '#faf5ff', cardBg: '#ffffff', textPrimary: '#1e293b', textSecondary: '#64748b', borderColor: '#e2e8f0', bgSecondary: '#f5f3ff' },
        forest: { primary: '#047857', secondary: '#65a30d', accent: '#0891b2', background: '#f0fdf4', cardBg: '#ffffff', textPrimary: '#1e293b', textSecondary: '#64748b', borderColor: '#e2e8f0', bgSecondary: '#ecfdf5' }
    };

    var t = themes[savedTheme] || themes.ocean;
    var r = document.documentElement;

    r.style.setProperty('--primary-color', t.primary);
    r.style.setProperty('--primary-light', t.primary);
    r.style.setProperty('--secondary-color', t.secondary);
    r.style.setProperty('--accent-color', t.accent);
    r.style.setProperty('--bg-color', t.background);
    r.style.setProperty('--bg-secondary', t.bgSecondary);
    r.style.setProperty('--card-bg', t.cardBg);
    r.style.setProperty('--text-primary', t.textPrimary);
    r.style.setProperty('--text-secondary', t.textSecondary);
    r.style.setProperty('--border-color', t.borderColor);
    r.style.setProperty('--gradient-primary', 'linear-gradient(135deg, ' + t.primary + ' 0%, ' + t.secondary + ' 100%)');
    r.style.setProperty('--gradient-accent', 'linear-gradient(135deg, ' + t.accent + ' 0%, ' + t.accent + '88 100%)');
})();