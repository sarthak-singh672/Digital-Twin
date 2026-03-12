// Digital Twin - Theme Management
class ThemeManager {
    constructor() {
        this.themes = {
            ocean: {
                name: 'Ocean Blue',
                primary: '#1e40af',
                secondary: '#06b6d4',
                accent: '#10b981',
                background: '#f8fafc',
                cardBg: '#ffffff',
                textPrimary: '#1e293b',
                textSecondary: '#64748b'
            },
            dark: {
                name: 'Dark Mode',
                primary: '#3b82f6',
                secondary: '#06b6d4',
                accent: '#10b981',
                background: '#0f172a',
                cardBg: '#1e293b',
                textPrimary: '#f8fafc',
                textSecondary: '#cbd5e1'
            },
            sunset: {
                name: 'Sunset Purple',
                primary: '#7c3aed',
                secondary: '#f59e0b',
                accent: '#ec4899',
                background: '#faf5ff',
                cardBg: '#ffffff',
                textPrimary: '#1e293b',
                textSecondary: '#64748b'
            },
            forest: {
                name: 'Forest Green',
                primary: '#047857',
                secondary: '#65a30d',
                accent: '#0891b2',
                background: '#f0fdf4',
                cardBg: '#ffffff',
                textPrimary: '#1e293b',
                textSecondary: '#64748b'
            }
        };

        this.currentTheme = 'ocean';
        this.init();
    }
    init() {
        this.loadSavedTheme();
        this.setupEventListeners();
        // Only detect system theme if user has NEVER picked a theme
        if (!localStorage.getItem('dt_theme')) {
            this.detectSystemTheme();
        }
    }
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('dt_theme') || 'ocean';
        this.setTheme(savedTheme);
    }

    setupEventListeners() {
        // Theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Theme selector dropdown
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }



        // Custom theme events
        document.addEventListener('themeChanged', (e) => {
            this.handleThemeChange(e.detail);
        });
    }

    setTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme '${themeName}' not found. Using default theme.`);
            themeName = 'ocean';
        }

        const theme = this.themes[themeName];
        const body = document.body;

        // Remove existing theme classes
        Object.keys(this.themes).forEach(name => {
            body.classList.remove(`theme-${name}`);
        });

        // Add new theme class
        body.classList.add(`theme-${themeName}`);

        // Update CSS custom properties
        this.updateCSSProperties(theme);

        // Update current theme
        this.currentTheme = themeName;

        // Save to localStorage
        localStorage.setItem('dt_theme', themeName);

        // Update UI elements
        this.updateThemeUI();

        // Trigger theme change event
        this.dispatchThemeChangeEvent(themeName, theme);

        // Update charts if they exist
        this.updateChartsTheme();
    }

    updateCSSProperties(theme) {
        const root = document.documentElement;

        // Update CSS custom properties
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
        root.style.setProperty('--accent-color', theme.accent);
        root.style.setProperty('--bg-color', theme.background);
        root.style.setProperty('--card-bg', theme.cardBg);
        root.style.setProperty('--text-primary', theme.textPrimary);
        root.style.setProperty('--text-secondary', theme.textSecondary);

        // Update gradients
        const primaryGradient = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
        const accentGradient = `linear-gradient(135deg, ${theme.accent} 0%, ${this.lightenColor(theme.accent, 20)} 100%)`;

        root.style.setProperty('--gradient-primary', primaryGradient);
        root.style.setProperty('--gradient-accent', accentGradient);
    }

    updateThemeUI() {
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                if (this.currentTheme === 'dark') {
                    icon.className = 'fas fa-sun';
                } else {
                    icon.className = 'fas fa-moon';
                }
            }
        }

        // Update theme selector
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
        }

        // Update meta theme color for mobile browsers
        this.updateMetaThemeColor();
    }

    updateMetaThemeColor() {
        const theme = this.themes[this.currentTheme];
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');

        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        metaThemeColor.content = theme.primary;
    }

    toggleTheme() {
        // Simple toggle between light and dark
        if (this.currentTheme === 'dark') {
            this.setTheme('ocean');
        } else {
            this.setTheme('dark');
        }
    }

    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.setTheme('dark');
        } else {
            this.setTheme('ocean');
        }
    }

    shouldFollowSystem() {
        return localStorage.getItem('dt_follow_system_theme') === 'true';
    }

    setFollowSystemTheme(follow) {
        localStorage.setItem('dt_follow_system_theme', follow.toString());
        if (follow) {
            this.detectSystemTheme();
        }
    }

    dispatchThemeChangeEvent(themeName, theme) {
        const event = new CustomEvent('themeChanged', {
            detail: {
                name: themeName,
                theme: theme,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    handleThemeChange(detail) {
        // Handle theme change from other components
        console.log('Theme changed:', detail);

        // Update any theme-dependent components
        this.updateComponentThemes();
    }

    updateComponentThemes() {
        // Update modals
        this.updateModalThemes();

        // Update tooltips
        this.updateTooltipThemes();

        // Update any custom components
        this.updateCustomComponentThemes();
    }

    updateModalThemes() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            // Update modal backdrop
            const backdrop = modal.style.background;
            if (this.currentTheme === 'dark') {
                modal.style.background = 'rgba(0, 0, 0, 0.8)';
            } else {
                modal.style.background = 'rgba(0, 0, 0, 0.5)';
            }
        });
    }

    updateTooltipThemes() {
        const tooltips = document.querySelectorAll('.tooltip-popup');
        tooltips.forEach(tooltip => {
            const theme = this.themes[this.currentTheme];
            tooltip.style.background = theme.textPrimary;
            tooltip.style.color = theme.cardBg;
        });
    }

    updateCustomComponentThemes() {
        // Update any custom components that need theme updates
        const customComponents = document.querySelectorAll('[data-theme-component]');
        customComponents.forEach(component => {
            const componentType = component.dataset.themeComponent;
            this.updateComponentTheme(component, componentType);
        });
    }

    updateComponentTheme(component, type) {
        const theme = this.themes[this.currentTheme];

        switch (type) {
            case 'card':
                component.style.background = theme.cardBg;
                component.style.color = theme.textPrimary;
                break;
            case 'button':
                if (component.classList.contains('btn-primary')) {
                    component.style.background = theme.primary;
                }
                break;
            // Add more component types as needed
        }
    }

    updateChartsTheme() {
        // Update Chart.js themes if charts are present
        if (window.Chart && window.dashboardManager) {
            const isDark = this.currentTheme === 'dark';
            const theme = this.themes[this.currentTheme];

            // Update default chart options
            Chart.defaults.color = theme.textSecondary;
            Chart.defaults.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            Chart.defaults.backgroundColor = theme.cardBg;

            // Update existing charts
            Object.values(window.dashboardManager.charts || {}).forEach(chart => {
                if (chart && typeof chart.update === 'function') {
                    chart.update('none');
                }
            });
        }
    }

    // Theme creation and customization
    createCustomTheme(name, colors) {
        const customTheme = {
            name: name,
            primary: colors.primary || '#1e40af',
            secondary: colors.secondary || '#06b6d4',
            accent: colors.accent || '#10b981',
            background: colors.background || '#f8fafc',
            cardBg: colors.cardBg || '#ffffff',
            textPrimary: colors.textPrimary || '#1e293b',
            textSecondary: colors.textSecondary || '#64748b'
        };

        this.themes[name] = customTheme;
        this.saveCustomThemes();

        return customTheme;
    }

    saveCustomThemes() {
        const customThemes = {};
        Object.keys(this.themes).forEach(key => {
            if (!['ocean', 'dark', 'sunset', 'forest'].includes(key)) {
                customThemes[key] = this.themes[key];
            }
        });

        localStorage.setItem('dt_custom_themes', JSON.stringify(customThemes));
    }

    loadCustomThemes() {
        try {
            const customThemes = localStorage.getItem('dt_custom_themes');
            if (customThemes) {
                const themes = JSON.parse(customThemes);
                Object.assign(this.themes, themes);
            }
        } catch (error) {
            console.error('Error loading custom themes:', error);
        }
    }

    deleteCustomTheme(name) {
        if (['ocean', 'dark', 'sunset', 'forest'].includes(name)) {
            console.warn('Cannot delete built-in theme');
            return false;
        }

        delete this.themes[name];
        this.saveCustomThemes();

        if (this.currentTheme === name) {
            this.setTheme('ocean');
        }

        return true;
    }

    // Utility methods
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;

        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;

        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    getCurrentTheme() {
        return {
            name: this.currentTheme,
            theme: this.themes[this.currentTheme]
        };
    }

    getAvailableThemes() {
        return Object.keys(this.themes).map(key => ({
            key: key,
            name: this.themes[key].name,
            colors: this.themes[key]
        }));
    }

    exportTheme(themeName) {
        if (!this.themes[themeName]) {
            return null;
        }

        return {
            name: themeName,
            theme: this.themes[themeName],
            version: '1.0.0',
            exportedAt: new Date().toISOString()
        };
    }

    importTheme(themeData) {
        try {
            if (typeof themeData === 'string') {
                themeData = JSON.parse(themeData);
            }

            if (themeData.theme && themeData.name) {
                this.themes[themeData.name] = themeData.theme;
                this.saveCustomThemes();
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error importing theme:', error);
            return false;
        }
    }
}

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.ThemeManager = new ThemeManager();
});