export function displayStatus(message: string, isSuccess: boolean = true) {
  const statusElement = document.getElementById('notification-status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = isSuccess ? 'status-message success' : 'status-message error';
  }
}