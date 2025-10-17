// sessionTimer.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // 30 minutes in milliseconds: 30 minutes * 60 seconds/minute * 1000 milliseconds/second
    const INACTIVITY_TIMEOUT_MS = 1 * 60 * 1000; 
    const REDIRECT_URL = 'index.html'; // Assume your login page is named index.html

    // --- DOM Elements ---
    const timeoutModal = document.getElementById('timeoutModal');
    
    // --- State Variable ---
    let timeoutTimer;

    /**
     * Resets the inactivity timer.
     * Clears the current timer and sets a new one.
     */
    function resetTimer() {
        clearTimeout(timeoutTimer);
        timeoutTimer = setTimeout(showTimeoutModal, INACTIVITY_TIMEOUT_MS);
    }

    /**
     * Displays the session timeout modal and stops the timer.
     * Prevents further page interaction.
     */
    function showTimeoutModal() {
        console.log('Session timed out due to inactivity.');
        // Set the modal to be visible
        if (timeoutModal) {
            timeoutModal.classList.add('visible');
        }
        
        // OPTIONAL: Immediately redirect if you don't want the user to see the modal first.
        // For a better UX, we show the modal and let the user click "Go to Login" or
        // redirect after a small grace period if they don't click anything.
        // Let's rely on the button click in the HTML to redirect (window.location.href='login.html').

        // Forcing a hard redirect after 5 seconds if the user doesn't click the button
        setTimeout(() => {
             // Only redirect if the modal is still visible, meaning the user hasn't refreshed or left
             if (timeoutModal && timeoutModal.classList.contains('visible')) {
                window.location.href = REDIRECT_URL;
             }
        }, 5000);
    }

    /**
     * Initializes all activity listeners.
     */
    function setupActivityListeners() {
        const events = [
            'mousemove', 'keydown', 'scroll', 'click', 'touchstart'
        ];

        // Attach listeners to the entire document
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // Start the initial timer
        resetTimer();
        console.log(`Session timer started. Timeout set for ${INACTIVITY_TIMEOUT_MS / 60000} minutes.`);
    }

    // --- Initialization ---
    // Only set up the timer if we are NOT on the login page itself
    if (!window.location.pathname.includes('login.html')) {
        setupActivityListeners();
    }
});