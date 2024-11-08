import { useStore } from '../../store/store';

// Add type for validation fields
type ValidationFields = 'days' | 'hours' | 'minutes' | 'seconds';

export function validateCustomTime() {
  const daysInput = document.getElementById('custom-days') as HTMLInputElement;
  const hoursInput = document.getElementById('custom-hours') as HTMLInputElement;
  const minutesInput = document.getElementById('custom-minutes') as HTMLInputElement;
  const secondsInput = document.getElementById('custom-seconds') as HTMLInputElement;
  const setNotificationButton = document.getElementById('set-notification') as HTMLButtonElement;
  const errorMessage = document.getElementById('custom-time-error') as HTMLDivElement;

  const inputs = [daysInput, hoursInput, minutesInput, secondsInput];
  const currentEvent = useStore.getState().currentEvent;
  
  if (!currentEvent) {
    setNotificationButton.disabled = true;
    errorMessage.textContent = 'No event selected.';
    errorMessage.style.display = 'block';
    return;
  }

  // Get remaining time in days/hours/minutes/seconds
  const remainingTime = currentEvent.endTime - Date.now();
  const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));

  // Individual field validations
  const days = parseInt(daysInput.value) || 0;
  const hours = parseInt(hoursInput.value) || 0;
  const minutes = parseInt(minutesInput.value) || 0;
  const seconds = parseInt(secondsInput.value) || 0;

  // More permissive individual validation rules
  const isValid: Record<ValidationFields, boolean> = {
    days: days >= 0 && days <= remainingDays,
    hours: hours >= 0 && hours <= 24,
    minutes: minutes >= 0 && minutes <= 60,
    seconds: seconds >= 0 && seconds <= 60
  };

  // Total time validation
  const totalMilliseconds = 
    days * 86400000 +
    hours * 3600000 +
    minutes * 60000 +
    seconds * 1000;

  // Handle no time entered case
  if (totalMilliseconds === 0) {
    setNotificationButton.disabled = true;
    errorMessage.style.display = 'none';
    inputs.forEach(input => {
      input.style.borderColor = '';
    });
    return;
  }

  const isTotalTimeValid = totalMilliseconds > 0 && totalMilliseconds < remainingTime;

  // Show appropriate error messages
  let errorText = '';
  if (!isTotalTimeValid && totalMilliseconds >= remainingTime) {
    errorText = 'Notification time cannot exceed the remaining time.';
    // Set all inputs to red when total time exceeds remaining time
    inputs.forEach(input => {
      input.style.borderColor = 'red';
    });
  } else {
    // Only set individual border colors based on field validation
    inputs.forEach((input, index) => {
      const fieldName = ['days', 'hours', 'minutes', 'seconds'][index] as ValidationFields;
      input.style.borderColor = isValid[fieldName] ? '' : 'red';
    });
  }

  // Update UI
  const isAllValid = isTotalTimeValid && Object.values(isValid).every(v => v);
  setNotificationButton.disabled = !isAllValid;
  errorMessage.textContent = errorText;
  errorMessage.style.display = errorText ? 'block' : 'none';
}
