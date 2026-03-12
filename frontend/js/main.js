// Digital Twin - Main Application
class DigitalTwinApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeComponents();
        this.loadUserData();
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('DOMContentLoaded', () => {
            this.highlightActiveNav();
            this.setupMobileMenu();
        });

        // Smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    initializeComponents() {
        // Initialize animations
        this.initializeAnimations();

        // Initialize counters for statistics
        this.initializeCounters();

        // Initialize tooltips
        this.initializeTooltips();
    }

    loadUserData() {
        // Load user preferences
        const savedTheme = localStorage.getItem('digitalTwinTheme') || 'ocean';
        this.setTheme(savedTheme);
    }

    highlightActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    setupMobileMenu() {
        // Mobile menu toggle (if needed)
        const navbar = document.querySelector('.navbar');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            if (window.scrollY > lastScrollY) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            lastScrollY = window.scrollY;
        });
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.className.includes('theme-dark') ? 'dark' : 'ocean';
        const newTheme = currentTheme === 'dark' ? 'ocean' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        const body = document.body;
        body.className = body.className.replace(/theme-\w+/g, '');
        body.classList.add(`theme-${theme}`);

        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        // Save theme preference
        localStorage.setItem('digitalTwinTheme', theme);
    }

    initializeAnimations() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        document.querySelectorAll('.feature-card, .stat-card, .chart-card').forEach(el => {
            observer.observe(el);
        });
    }

    initializeCounters() {
        const counters = document.querySelectorAll('.stat-number');

        const animateCounter = (element, target) => {
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }

                // Format number with commas
                element.textContent = Math.floor(current).toLocaleString();
            }, 20);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.textContent.replace(/,/g, ''));
                    if (!isNaN(target)) {
                        animateCounter(entry.target, target);
                    }
                    observer.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => observer.observe(counter));
    }

    initializeTooltips() {
        // Simple tooltip implementation
        const tooltips = document.querySelectorAll('[data-tooltip]');

        tooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip-popup';
                tooltip.textContent = e.target.getAttribute('data-tooltip');
                document.body.appendChild(tooltip);

                const rect = e.target.getBoundingClientRect();
                tooltip.style.position = 'absolute';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.zIndex = '10000';
                tooltip.style.background = 'var(--text-primary)';
                tooltip.style.color = 'var(--card-bg)';
                tooltip.style.padding = '8px 12px';
                tooltip.style.borderRadius = '6px';
                tooltip.style.fontSize = '14px';
                tooltip.style.whiteSpace = 'nowrap';
                tooltip.style.opacity = '0';
                tooltip.style.transition = 'opacity 0.2s';

                setTimeout(() => tooltip.style.opacity = '1', 10);
            });

            element.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.tooltip-popup');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }

    // Utility Methods
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        toast.innerHTML = `
            <div class="toast-header">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${this.getToastTitle(type)}</span>
            </div>
            <div class="toast-body">${message}</div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('active'), 100);

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    getToastTitle(type) {
        const titles = {
            success: 'Success',
            warning: 'Warning',
            error: 'Error',
            info: 'Information'
        };
        return titles[type] || titles.info;
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    formatTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    formatNumber(number, decimals = 1) {
        return parseFloat(number).toFixed(decimals);
    }
}

// Initialize the application
const app = new DigitalTwinApp();

// Export for use in other modules
window.DigitalTwinApp = app;