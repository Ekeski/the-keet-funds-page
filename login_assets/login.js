document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const loginButton = document.getElementById('loginButton');
    const formLoaderContainer = document.querySelector('.loader-container');
    const serverMessage = document.getElementById('serverMessage'); // Still used for rate limit/retry messages
    const authServiceStatus = document.getElementById('authServiceStatus');
    const successModal = document.getElementById('successModal');
    // NEW: Get failure modal elements
    const failureModal = document.getElementById('failureModal');
    const failureMessageDetail = document.getElementById('failureMessageDetail');
    const closeFailureModal = document.getElementById('closeFailureModal');

    // --- Configuration Constants ---
    const RATE_LIMIT_ATTEMPTS = 5;
    const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
    const RETRY_MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 2000; // 2 seconds
    const MOCK_SERVICE_DOWN = false; // Set to true to test graceful degradation

    // --- State Variables ---
    let loginAttempts = [];
    let isSubmitting = false;
    let authServiceIsDown = MOCK_SERVICE_DOWN;

   

    // --- Utility Functions (storeTokenSecurely, isValidEmail, validateInputs, checkRateLimit, toggleLoader, displayServerMessage remain largely the same) ---
    function storeTokenSecurely(token) {
        try {
            sessionStorage.setItem('authToken', btoa(token));
            console.log('Token stored in sessionStorage (Secure storage simulation).');
        } catch (e) {
            console.error('Could not store token:', e);
            alert('Security storage failed. Please check browser settings.');
        }
    }

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateInputs = () => {
        let valid = true;
        
        if (!emailInput.value.trim()) {
            emailError.textContent = 'Email is required.';
            valid = false;
        } else if (!isValidEmail(emailInput.value.trim())) {
            emailError.textContent = 'Please enter a valid email address.';
            valid = false;
        } else {
            emailError.textContent = '';
        }

        if (!passwordInput.value.trim()) {
            passwordError.textContent = 'Password is required.';
            valid = false;
        } else if (passwordInput.value.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters.';
            valid = false;
        } else {
            passwordError.textContent = '';
        }

        return valid;
    };
    
    emailInput.addEventListener('blur', validateInputs);
    passwordInput.addEventListener('blur', validateInputs);
    emailInput.addEventListener('input', () => emailError.textContent = '');
    passwordInput.addEventListener('input', () => passwordError.textContent = '');

    const checkRateLimit = () => {
        const now = Date.now();
        loginAttempts = loginAttempts.filter(time => now - time < RATE_LIMIT_WINDOW_MS);

        if (loginAttempts.length >= RATE_LIMIT_ATTEMPTS) {
            const timeLeft = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - loginAttempts[0])) / 1000);
            serverMessage.textContent = `Too many login attempts. Please try again in ${timeLeft} seconds.`;
            serverMessage.classList.add('error');
            loginButton.disabled = true;
            setTimeout(() => {
                loginButton.disabled = false;
                serverMessage.textContent = '';
                serverMessage.classList.remove('error');
            }, (now - loginAttempts[0]) + RATE_LIMIT_WINDOW_MS - now);
            return false;
        }

        return true;
    };

    const toggleLoader = (isVisible) => {
        if (isVisible) {
            formLoaderContainer.classList.add('visible');
            loginButton.disabled = true;
        } else {
            formLoaderContainer.classList.remove('visible');
            loginButton.disabled = false;
        }
    };

    // This is still useful for temporary messages like retry status or rate limit
    const displayServerMessage = (message, isError) => {
        serverMessage.textContent = message;
        serverMessage.classList.toggle('error', isError);
        setTimeout(() => {
            serverMessage.textContent = '';
            serverMessage.classList.remove('error');
        }, 5000);
    };
    
    const showSuccessModal = () => {
        successModal.classList.add('visible');
        setTimeout(() => {
            successModal.classList.remove('visible');
            console.log('Redirecting to dashboard...');
            window.location.href = '/index.html';  // Linking of the login page to the home page after successful login
        }, 2000); 
    };

    // NEW: Function to show the failure modal
    const showFailureModal = (message) => {
        failureMessageDetail.textContent = message;
        failureModal.classList.add('visible');
        // No automatic close, user must click button
    };

    // NEW: Close button event listener for failure modal
    closeFailureModal.addEventListener('click', () => {
        failureModal.classList.remove('visible');
    });


    async function mockAuthRequest(email, password, attempt = 1) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (authServiceIsDown) {
                    return reject({ status: 503, message: 'Authentication service is temporarily unavailable.' });
                }

                if (email === 'test@correct.com' && password === 'password123') {
                    return resolve({ success: true, token: `mock-jwt-${Math.random()}` });
                } else if (email === 'error@simulate.com') {
                    return reject({ status: 500, message: 'Server error, retrying...' });
                } else {
                    return resolve({ success: false, message: 'Invalid email or password.' });
                }
            }, 1500);
        });
    }

    async function handleLoginAttempt(email, password, retryCount = 0) {
        try {
            const response = await mockAuthRequest(email, password, retryCount + 1);

            if (!response.success) {
                toggleLoader(false);
                loginAttempts.push(Date.now());
                // NEW: Show failure modal for invalid credentials
                showFailureModal(response.message); 
                return;
            }

            // Success Path
            toggleLoader(false);
            storeTokenSecurely(response.token);
            showSuccessModal(); 

        } catch (error) {
            // Check if error is retryable (e.g., 500)
            if (error.status === 500 && retryCount < RETRY_MAX_ATTEMPTS) {
                console.warn(`Attempt ${retryCount + 1} failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
                displayServerMessage(`Server connection failed. Retrying (Attempt ${retryCount + 1}/${RETRY_MAX_ATTEMPTS})...`, true);
                
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                
                await handleLoginAttempt(email, password, retryCount + 1);
            
            } else {
                // Final error or non-retryable error (e.g., 503 from service down)
                toggleLoader(false);
                loginAttempts.push(Date.now());

                if (error.status === 503) {
                    authServiceIsDown = true;
                    authServiceStatus.textContent = '⚠️ Auth Service DOWN: Limited functionality available.';
                    authServiceStatus.classList.add('down');
                    // NEW: Show failure modal for service down, and disable button
                    showFailureModal('The login service is unavailable. Please try again later.'); 
                    loginButton.disabled = true;
                } else {
                    // NEW: Show failure modal for any other final error
                    showFailureModal(`Login failed: ${error.message || 'Unknown error.'}`);
                }
            }
        }
    }

    // --- Form Submission Handler (Remains the same) ---

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateInputs()) {
            displayServerMessage('Please correct the validation errors.', true);
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!checkRateLimit()) {
            return;
        }

        if (isSubmitting) return;
        isSubmitting = true;
        
        if (isValidEmail(email)) {
            toggleLoader(true);
        } else {
             displayServerMessage('Invalid email format. Loader not shown.', true);
             isSubmitting = false;
             return;
        }
        
        serverMessage.textContent = '';
        serverMessage.classList.remove('error');

        await handleLoginAttempt(email, password);

        isSubmitting = false;
        if (!formLoaderContainer.classList.contains('visible')) {
             loginButton.disabled = false;
        }
    });

    if (authServiceIsDown) {
        authServiceStatus.textContent = '⚠️ Auth Service DOWN: Limited functionality available.';
        authServiceStatus.classList.add('down');
        loginButton.disabled = true;
    }
});