// Authentication Handler
const BASE_URL = API_CONFIG.BASE_URL;

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
        this.registeredBanner = document.getElementById('registeredBanner');
        this.termsLink = document.getElementById('termsLink');
        this.termsModal = document.getElementById('termsModal');
        this.termsCloseBtn = document.getElementById('termsCloseBtn');
        this.termsAcceptBtn = document.getElementById('termsAcceptBtn');
        this.otpContainer = document.getElementById('otpForm');
        this.otpForm = document.getElementById('otpFormElement');
        this.otpCodeInput = document.getElementById('otpCode');
        this.otpEmailDisplay = document.getElementById('otpEmailDisplay');
        this.resendOtpBtn = document.getElementById('resendOtpBtn');
        this.otpCooldownText = document.getElementById('otpCooldownText');
        this.otpBackToSignup = document.getElementById('otpBackToSignup');
        this.signupEmailInput = document.getElementById('signupEmail');
        this.signupEmailError = document.getElementById('signupEmailError');
        this.signupSubmitBtn = document.getElementById('signupSubmitBtn');
        this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.pendingEmail = localStorage.getItem('pending_verification_email');
        this.otpCooldownTimer = null;

        this.init();
    }

    init() {
        // Check if already logged in
        if (window.DigitalTwinAPI.isAuthenticated()) {
            // STEP 1 FIX: If already logged in, go to Homepage, not Dashboard
            window.location.href = './index.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
            this.showLoginForm();
            this.showRegisteredBanner();
        }

        if (this.pendingEmail) {
            this.showOtpForm(this.pendingEmail);
        }

        // Form submission handlers
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.signupForm) {
            this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        if (this.otpForm) {
            this.otpForm.addEventListener('submit', (e) => this.handleOtpVerify(e));
        }

        if (this.resendOtpBtn) {
            this.resendOtpBtn.addEventListener('click', () => this.handleResendOtp());
        }

        if (this.otpBackToSignup) {
            this.otpBackToSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearPendingEmail();
                this.showSignupForm();
            });
        }

        if (this.signupEmailInput) {
            this.signupEmailInput.addEventListener('input', () => this.updateEmailValidity());
            this.updateEmailValidity();
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

        this.setupTermsModal();
    }

    showLoginForm() {
        this.signupContainer.classList.remove('active');
        if (this.otpContainer) this.otpContainer.classList.remove('active');
        this.loginContainer.classList.add('active');
        this.hideMessages();
    }

    showSignupForm() {
        this.loginContainer.classList.remove('active');
        if (this.otpContainer) this.otpContainer.classList.remove('active');
        this.signupContainer.classList.add('active');
        this.hideMessages();
    }

    showOtpForm(email) {
        if (!this.otpContainer) return;
        this.loginContainer.classList.remove('active');
        this.signupContainer.classList.remove('active');
        this.otpContainer.classList.add('active');
        this.hideMessages();
        this.pendingEmail = email;
        localStorage.setItem('pending_verification_email', email);
        if (this.otpEmailDisplay) {
            this.otpEmailDisplay.textContent = email;
        }
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

    showRegisteredBanner() {
        if (!this.registeredBanner) return;
        this.registeredBanner.textContent = '✅ Account created! Please login with your new credentials.';
        this.registeredBanner.style.display = 'block';
        setTimeout(() => {
            this.registeredBanner.style.display = 'none';
        }, 4000);
    }

    setupTermsModal() {
        if (!this.termsLink || !this.termsModal) return;

        const openModal = (e) => {
            if (e) e.preventDefault();
            this.termsModal.classList.add('active');
        };

        const closeModal = () => {
            this.termsModal.classList.remove('active');
        };

        this.termsLink.addEventListener('click', openModal);
        if (this.termsCloseBtn) this.termsCloseBtn.addEventListener('click', closeModal);
        if (this.termsAcceptBtn) this.termsAcceptBtn.addEventListener('click', closeModal);
        this.termsModal.addEventListener('click', (e) => {
            if (e.target === this.termsModal) closeModal();
        });
    }

    hideMessages() {
        this.errorDiv.style.display = 'none';
        this.successDiv.style.display = 'none';
    }

    clearPendingEmail() {
        this.pendingEmail = null;
        localStorage.removeItem('pending_verification_email');
        if (this.otpCodeInput) this.otpCodeInput.value = '';
    }

    updateEmailValidity() {
        if (!this.signupEmailInput) return false;
        const email = this.signupEmailInput.value.trim();
        const isValid = email.length > 0 && this.emailRegex.test(email);
        if (this.signupEmailError) {
            if (!email) {
                this.signupEmailError.style.display = 'none';
            } else if (!isValid) {
                this.signupEmailError.textContent = 'Please enter a valid email address';
                this.signupEmailError.style.display = 'block';
            } else {
                this.signupEmailError.style.display = 'none';
            }
        }
        if (this.signupSubmitBtn) {
            this.signupSubmitBtn.disabled = !isValid;
        }
        return isValid;
    }

    startOtpCooldown(seconds = 60) {
        if (!this.resendOtpBtn || !this.otpCooldownText) return;
        let remaining = seconds;
        this.resendOtpBtn.disabled = true;
        this.otpCooldownText.textContent = `Resend available in ${remaining}s`;
        if (this.otpCooldownTimer) clearInterval(this.otpCooldownTimer);
        this.otpCooldownTimer = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(this.otpCooldownTimer);
                this.otpCooldownTimer = null;
                this.resendOtpBtn.disabled = false;
                this.otpCooldownText.textContent = '';
            } else {
                this.otpCooldownText.textContent = `Resend available in ${remaining}s`;
            }
        }, 1000);
    }

    async handleResendOtp() {
        if (!this.pendingEmail) {
            this.showError('Please enter your email again.');
            return;
        }
        this.showLoading();
        try {
            await window.DigitalTwinAPI.sendOtp(this.pendingEmail);
            this.hideLoading();
            this.showSuccess('If your email exists, a new code has been sent.');
            this.startOtpCooldown(60);
        } catch (error) {
            this.hideLoading();
            this.showError(error.message || 'Could not resend code.');
        }
    }

    async handleOtpVerify(e) {
        e.preventDefault();
        if (!this.pendingEmail) {
            this.showError('Please enter your email again.');
            return;
        }
        const otp = this.otpCodeInput ? this.otpCodeInput.value.trim() : '';
        if (!otp) {
            this.showError('Please enter the verification code.');
            return;
        }
        this.showLoading();
        try {
            await window.DigitalTwinAPI.verifyOtp(this.pendingEmail, otp);
            this.hideLoading();
            this.showSuccess('Email verified! Please log in.');
            this.clearPendingEmail();
            this.showLoginForm();
        } catch (error) {
            this.hideLoading();
            this.showError(error.message || 'Verification failed. Please try again.');
        }
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
                const userRes = await fetch(`${BASE_URL}/users/me`, {
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
            const message = error.message || 'Login failed. Please check your credentials.';
            if (message.includes('Email not verified')) {
                if (this.emailRegex.test(username)) {
                    this.showOtpForm(username);
                    try {
                        await window.DigitalTwinAPI.sendOtp(username);
                        this.startOtpCooldown(60);
                    } catch (otpError) {
                        console.error('OTP send error:', otpError);
                    }
                }
            }
            this.showError(message);
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
        if (!this.emailRegex.test(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.showLoading();
        this.hideMessages();

        try {
            await window.DigitalTwinAPI.signup({
                username: username,
                email: email,
                password: password,
                password_confirm: passwordConfirm,
                first_name: firstName,
                last_name: lastName
            });

            this.hideLoading();
            this.showSuccess('Account created! Check your email for the verification code.');
            this.showOtpForm(email);
            this.startOtpCooldown(60);

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
