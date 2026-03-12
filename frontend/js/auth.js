// Authentication Handler

class AuthHandler {
    constructor() {
        this.loginForm = document.getElementById('loginFormElement');
        this.signupForm = document.getElementById('signupFormElement');
        this.loginContainer = document.getElementById('loginForm');
        this.signupContainer = document.getElementById('signupForm');
        this.showSignupBtn = document.getElementById('showSignup');
        this.showLoginBtn = document.getElementById('showLogin');
        this.loading = document.getElementById('authLoading');
        this.errorDiv = document.getElementById('authError');
        this.successDiv = document.getElementById('authSuccess');

        this.init();
    }

    init() {
        // Check if already logged in
        if (window.DigitalTwinAPI.isAuthenticated()) {
            // STEP 1 FIX: If already logged in, go to Homepage, not Dashboard
            window.location.href = './index.html';
            return;
        }

        // Form submission handlers
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.signupForm) {
            this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Toggle between login and signup
        if (this.showSignupBtn) {
            this.showSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSignupForm();
            });
        }

        if (this.showLoginBtn) {
            this.showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
    }

    showLoginForm() {
        this.signupContainer.classList.remove('active');
        this.loginContainer.classList.add('active');
        this.hideMessages();
    }

    showSignupForm() {
        this.loginContainer.classList.remove('active');
        this.signupContainer.classList.add('active');
        this.hideMessages();
    }

    showLoading() {
        this.loading.style.display = 'flex';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showError(message) {
        this.hideMessages();
        this.errorDiv.textContent = message;
        this.errorDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        this.hideMessages();
        this.successDiv.textContent = message;
        this.successDiv.style.display = 'block';
    }

    hideMessages() {
        this.errorDiv.style.display = 'none';
        this.successDiv.style.display = 'none';
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showError('Please enter both username/email and password');
            return;
        }

        this.showLoading();
        this.hideMessages();

        try {
            const response = await window.DigitalTwinAPI.login({
                username: username,
                password: password
            });
                   // ✅ NEW: Fetch theme from database after login
            try {
                const token = localStorage.getItem('access_token');
               const userRes = await fetch('https://digital-twin-production.up.railway.app/api/v1/users/me', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    const dbTheme = userData.theme || 'ocean';
                    localStorage.setItem('dt_theme', dbTheme);
                    console.log('[Auth] Loaded theme from DB:', dbTheme);
                }
            } catch (themeErr) {
                console.log('[Auth] Could not fetch theme, using default');
            }

            this.hideLoading();
            // UPDATED MESSAGE: Reflecting the true flow
            this.showSuccess('Login successful! Taking you home...');

            // Redirect to Homepage after 1 second
            setTimeout(() => {
                // STEP 1 FIX: Redirect to index.html
                window.location.href = './index.html';
            }, 1000);

        } catch (error) {
            this.hideLoading();
            console.error('Login error:', error);
            this.showError(error.message || 'Login failed. Please check your credentials.');
        }
    }

    async handleSignup(e) {
        e.preventDefault();

        const firstName = document.getElementById('signupFirstName').value.trim();
        const lastName = document.getElementById('signupLastName').value.trim();
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!firstName || !lastName || !username || !email || !password || !passwordConfirm) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            this.showError('Password must be at least 8 characters long');
            return;
        }

        if (password !== passwordConfirm) {
            this.showError('Passwords do not match');
            return;
        }

        if (!agreeTerms) {
            this.showError('Please agree to the Terms of Service');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.showLoading();
        this.hideMessages();

        try {
            const response = await window.DigitalTwinAPI.signup({
                username: username,
                email: email,
                password: password,
                password_confirm: passwordConfirm,
                first_name: firstName,
                last_name: lastName
            });

            this.hideLoading();
            // UPDATED MESSAGE
            this.showSuccess('Account created! Let\'s go home...');

            // Redirect to Homepage after 1.5 seconds
            setTimeout(() => {
                // STEP 1 FIX: Redirect to index.html
                window.location.href = './index.html';
            }, 1500);

        } catch (error) {
            this.hideLoading();
            console.error('Signup error:', error);

            // Handle specific error messages
            let errorMessage = 'Signup failed. Please try again.';
            if (error.message.includes('username')) {
                errorMessage = 'Username already exists. Please choose another.';
            } else if (error.message.includes('email')) {
                errorMessage = 'Email already registered. Please use another email or login.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            this.showError(errorMessage);
        }
    }
}

// Initialize auth handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AuthHandler();
});