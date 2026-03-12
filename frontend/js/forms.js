// Digital Twin - Form Management (FULLY FIXED)

var FormManager = (function() {

    var currentStep = 1;
    var totalSteps = 3;
    var formData = {};
    var existingData = { vitals: null, lifestyle: null, academic: null };

    function init() {
        if (!window.DigitalTwinAPI || !window.DigitalTwinAPI.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        var form = document.getElementById('healthForm');
        if (form) {
            form.setAttribute('novalidate', '');
        }

        setupEventListeners();
        setupTabSwitching();
        setupRangeInputs();
        updateStepDisplay();
        updateProgress();
        loadExistingData();
    }

    // =============================================
    // FIX PROBLEM 1: CLICKABLE TAB SWITCHING
    // =============================================
    function setupTabSwitching() {
        var stepIndicators = document.querySelectorAll('.progress-steps .step');

        stepIndicators.forEach(function(indicator) {
            indicator.addEventListener('click', function() {
                var targetStep = parseInt(indicator.dataset.step);
                currentStep = targetStep;
                updateStepDisplay();
                updateProgress();
            });
        });
    }

    function setupEventListeners() {
        var form = document.getElementById('healthForm');
        var nextBtn = document.getElementById('nextBtn');
        var prevBtn = document.getElementById('prevBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', function() { nextStep(); });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', function() { prevStep(); });
        }

        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                submitForm();
            });
        }
    }

    function setupRangeInputs() {
        var ranges = [
            { id: 'stressLevel', display: 'stressValue' },
            { id: 'dietQuality', display: 'dietValue' },
            { id: 'focusLevel', display: 'focusValue' }
        ];
        ranges.forEach(function(item) {
            var input = document.getElementById(item.id);
            var display = document.getElementById(item.display);
            if (input && display) {
                display.textContent = input.value;
                input.addEventListener('input', function(e) {
                    display.textContent = e.target.value;
                });
            }
        });
    }

    // =============================================
    // FIX PROBLEM 3: LOAD EXISTING DATA ON PAGE LOAD
    // =============================================
        function loadExistingData() {
        Promise.all([
            window.DigitalTwinAPI.getVitals(30),
            window.DigitalTwinAPI.getLifestyle(30),
            window.DigitalTwinAPI.getAcademic(30),
            window.DigitalTwinAPI.getActivity(30)
        ]).then(function(results) {
            var vitalsRes = results[0];
            var lifestyleRes = results[1];
            var academicRes = results[2];
            var activityRes = results[3];
            var today = getTodayDate();

            var todayVitals = findTodayRecord(vitalsRes.results, 'ts', today);
            var todayLifestyle = findTodayRecord(lifestyleRes.results, 'date', today);
            var todayAcademic = findTodayRecord(academicRes.results, 'date', today);
            var todayActivity = findTodayRecord(activityRes.results, 'date', today);

            existingData = {
                vitals: todayVitals,
                lifestyle: todayLifestyle,
                academic: todayAcademic,
                activity: todayActivity
            };

            if (todayVitals) {
                setFieldValue('heartRate', todayVitals.hr);
                setFieldValue('bpSystolic', todayVitals.bp_sys);
                setFieldValue('bpDiastolic', todayVitals.bp_dia);
                setFieldValue('temperature', todayVitals.temp);
                setFieldValue('spo2', todayVitals.spo2);
            }

            if (todayLifestyle) {
                setFieldValue('sleepHours', todayLifestyle.sleep_hrs);
                setRangeValue('stressLevel', 'stressValue', todayLifestyle.stress_score);
                setRangeValue('dietQuality', 'dietValue', todayLifestyle.diet_score);
                setFieldValue('waterIntake', todayLifestyle.water_glasses);
            }

            if (todayActivity) {
                var activityHours = (todayActivity.exercise_mins / 60).toFixed(1);
                setFieldValue('physicalActivity', activityHours);
            }

            if (todayAcademic) {
                setFieldValue('studyHours', todayAcademic.study_hrs);
                setFieldValue('attendance', todayAcademic.attendance_pct);
                setFieldValue('assignmentsCompleted', todayAcademic.assignments_on_time);
            }

            if (todayVitals || todayLifestyle || todayAcademic || todayActivity) {
                showNotification('Today\'s saved data has been loaded. Edit and re-submit to update.', 'info');
            }

                }).catch(function(error) {
            console.error('Error loading existing data:', error);
        });
    }

    function findTodayRecord(records, dateField, today) {
        if (!records || !Array.isArray(records)) return null;
        for (var i = 0; i < records.length; i++) {
            var recordDate = records[i][dateField];
            if (!recordDate) continue;
            var dateStr = recordDate.substring(0, 10);
            if (dateStr === today) return records[i];
        }
        return null;
    }

    function setFieldValue(fieldId, value) {
        var field = document.getElementById(fieldId);
        if (field && value !== null && value !== undefined) {
            field.value = value;
        }
    }

    function setRangeValue(inputId, displayId, value) {
        var input = document.getElementById(inputId);
        var display = document.getElementById(displayId);
        if (input && value !== null && value !== undefined) {
            input.value = value;
            if (display) display.textContent = value;
        }
    }

    // =============================================
    // HELPERS
    // =============================================
    function getTodayDate() {
        var today = new Date();
        var yyyy = today.getFullYear();
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var dd = String(today.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
    }

    function validateStep(step) {
        var stepElement = document.querySelector('.form-step[data-step="' + step + '"]');
        if (!stepElement) return true;

        var requiredInputs = stepElement.querySelectorAll('input[required]');
        var isValid = true;
        var firstInvalid = null;

        requiredInputs.forEach(function(input) {
            if (!input.value || !input.checkValidity()) {
                input.classList.add('invalid');
                isValid = false;
                if (!firstInvalid) firstInvalid = input;
            } else {
                input.classList.remove('invalid');
            }
        });

        if (!isValid) {
            showNotification('Please fill in all required fields correctly', 'error');
            if (firstInvalid) firstInvalid.focus();
        }
        return isValid;
    }

    function validateAllSteps() {
        for (var step = 1; step <= totalSteps; step++) {
            if (!validateStep(step)) {
                currentStep = step;
                updateStepDisplay();
                updateProgress();
                return false;
            }
        }
        return true;
    }

    // =============================================
    // NAVIGATION
    // =============================================
    function nextStep() {
        if (!validateStep(currentStep)) return;

        if (currentStep < totalSteps) {
            currentStep++;
            updateStepDisplay();
            updateProgress();
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            updateStepDisplay();
            updateProgress();
        }
    }

    function updateStepDisplay() {
        var steps = document.querySelectorAll('.form-step');
        steps.forEach(function(step) {
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        var prevBtn = document.getElementById('prevBtn');
        var nextBtn = document.getElementById('nextBtn');
        var submitBtn = document.getElementById('submitBtn');

        if (prevBtn) {
            prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-block';
        }

        if (currentStep === totalSteps) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-block';
        } else {
            if (nextBtn) nextBtn.style.display = 'inline-block';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }

    function updateProgress() {
        var progressBar = document.getElementById('progressFill');
        var stepIndicators = document.querySelectorAll('.step');

        var progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

        if (progressBar) {
            progressBar.style.width = progress + '%';
        }

        stepIndicators.forEach(function(indicator) {
            var stepNum = parseInt(indicator.dataset.step);
            if (stepNum < currentStep) {
                indicator.classList.add('completed');
                indicator.classList.remove('active');
            } else if (stepNum === currentStep) {
                indicator.classList.add('active');
                indicator.classList.remove('completed');
            } else {
                indicator.classList.remove('active', 'completed');
            }
        });
    }

    function collectStepData() {
        formData = {};
        var inputs = document.querySelectorAll('#healthForm input');
        inputs.forEach(function(input) {
            if (input.id) {
                formData[input.id] = input.value;
            }
        });
    }

    // =============================================
    // FIX PROBLEM 2 & 4: SUBMIT + POPUP + STAY ON PAGE
    // =============================================
       function submitForm() {
        if (!validateAllSteps()) return;

        collectStepData();

        var submitBtn = document.getElementById('submitBtn');
        var originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        var today = getTodayDate();

        var vitalsData = {
            hr: parseInt(formData.heartRate),
            bp_sys: parseInt(formData.bpSystolic),
            bp_dia: parseInt(formData.bpDiastolic),
            temp: parseFloat(formData.temperature),
            spo2: parseInt(formData.spo2)
        };

        var lifestyleData = {
            date: today,
            sleep_hrs: parseFloat(formData.sleepHours),
            stress_score: parseInt(formData.stressLevel),
            diet_score: parseInt(formData.dietQuality),
            water_glasses: parseInt(formData.waterIntake)
        };

        var academicData = {
            date: today,
            study_hrs: parseFloat(formData.studyHours),
            attendance_pct: parseFloat(formData.attendance),
            assignments_on_time: parseFloat(formData.assignmentsCompleted)
        };

        var activityData = {
            date: today,
            steps: 0,
            exercise_mins: Math.round(parseFloat(formData.physicalActivity || 0) * 60)
        };

        Promise.all([
            window.DigitalTwinAPI.submitVitals(vitalsData),
            window.DigitalTwinAPI.submitLifestyle(lifestyleData),
            window.DigitalTwinAPI.submitAcademic(academicData),
            window.DigitalTwinAPI.submitActivity(activityData)
        ]).then(function(results) {
            console.log('Vitals submitted:', results[0]);
            console.log('Lifestyle submitted:', results[1]);
            console.log('Academic submitted:', results[2]);
            console.log('Activity submitted:', results[3]);

            showSuccessPopup();

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            existingData = {
                vitals: vitalsData,
                lifestyle: lifestyleData,
                academic: academicData,
                activity: activityData
            };

        }).catch(function(error) {
            console.error('Submission error:', error);
            showNotification('Error saving data: ' + error.message, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }
    // =============================================
    // FIX PROBLEM 4: SUCCESS POPUP MODAL
    // =============================================
    function showSuccessPopup() {
        var existingPopup = document.getElementById('successPopup');
        if (existingPopup) existingPopup.remove();

        var overlay = document.createElement('div');
        overlay.id = 'successPopup';
        overlay.innerHTML =
            '<div class="popup-overlay">' +
                '<div class="popup-content">' +
                    '<div class="popup-icon">' +
                        '<i class="fas fa-check-circle"></i>' +
                    '</div>' +
                    '<h2>All Entries Saved!</h2>' +
                    '<p>All your entries have been saved successfully.</p>' +
                    '<p class="popup-subtitle">You can edit any section and re-submit to update your data.</p>' +
                    '<div class="popup-buttons">' +
                        '<button class="btn btn-secondary" id="popupStayBtn">' +
                            '<i class="fas fa-edit"></i> Stay & Edit' +
                        '</button>' +
                        '<button class="btn btn-primary" id="popupDashboardBtn">' +
                            '<i class="fas fa-chart-line"></i> Go to Dashboard' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('popupStayBtn').addEventListener('click', function() {
            overlay.remove();
            currentStep = 1;
            updateStepDisplay();
            updateProgress();
        });

        document.getElementById('popupDashboardBtn').addEventListener('click', function() {
            window.location.href = 'dashboard.html';
        });

        overlay.querySelector('.popup-overlay').addEventListener('click', function(e) {
            if (e.target.classList.contains('popup-overlay')) {
                overlay.remove();
            }
        });
    }

    function showNotification(message, type) {
        if (!type) type = 'info';

        var notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.textContent = message;

        var bgColor = '#3b82f6';
        if (type === 'success') bgColor = '#10b981';
        if (type === 'error') bgColor = '#ef4444';

        notification.style.cssText =
            'position:fixed;top:20px;right:20px;padding:16px 24px;' +
            'background:' + bgColor + ';color:white;border-radius:8px;' +
            'box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;' +
            'animation:slideIn 0.3s ease-out;max-width:400px;';

        document.body.appendChild(notification);

        setTimeout(function() {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(function() {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    return { init: init };

})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    FormManager.init();
});

// Inject styles
(function() {
    var style = document.createElement('style');
    style.textContent =
        '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }' +
        '@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }' +
        '@keyframes popupFadeIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }' +
        '@keyframes bounceIn { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }' +
        'input.invalid { border: 2px solid #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }' +
        '.popup-overlay { position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:20000;backdrop-filter:blur(4px); }' +
        '.popup-content { background:white;border-radius:16px;padding:40px;text-align:center;max-width:450px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:popupFadeIn 0.4s ease-out; }' +
        '.popup-icon { margin-bottom:20px; }' +
        '.popup-icon i { font-size:64px;color:#10b981;animation:bounceIn 0.6s ease-out; }' +
        '.popup-content h2 { color:#1f2937;margin-bottom:12px;font-size:1.5rem; }' +
        '.popup-content p { color:#6b7280;margin-bottom:8px;font-size:1rem; }' +
        '.popup-subtitle { font-size:0.875rem !important;color:#9ca3af !important;margin-bottom:24px !important; }' +
        '.popup-buttons { display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap; }' +
        '.popup-buttons .btn { padding:12px 24px;border-radius:8px;font-weight:600;cursor:pointer;border:none;font-size:0.95rem;transition:transform 0.2s,box-shadow 0.2s; }' +
        '.popup-buttons .btn:hover { transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.15); }' +
        '.popup-buttons .btn-secondary { background:#f3f4f6;color:#374151; }' +
        '.popup-buttons .btn-primary { background:linear-gradient(135deg,#3b82f6,#2563eb);color:white; }';
    document.head.appendChild(style);
})();