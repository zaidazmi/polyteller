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
        }, 300); // Wait for fade out animation
    }, 1000); // Show for 1 second
}