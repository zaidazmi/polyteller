/**
 * Displays a toast message in the popup.
 * @param message - The message to display
 * @param isSuccess - Whether this is a success message (green) or error message (red)
 */
export function displayStatus(message: string, isSuccess: boolean = true) {
    let toastContainer = document.querySelector('.toast-container');
    
    // Create container if it doesn't exist
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast-message ${isSuccess ? 'success' : 'error'}`;
    toast.textContent = message;

    // Remove any existing toasts
    toastContainer.innerHTML = '';
    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove toast after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 300); // Keep fade out animation time
    }, 2000); // Show for 2 seconds
}