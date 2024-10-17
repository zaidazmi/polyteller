import { useStore } from '../../store/store';

export function validateCustomTime() {
  const daysInput = document.getElementById('custom-days') as HTMLInputElement;
  const hoursInput = document.getElementById('custom-hours') as HTMLInputElement;
  const minutesInput = document.getElementById('custom-minutes') as HTMLInputElement;
  const secondsInput = document.getElementById('custom-seconds') as HTMLInputElement;
  const setNotificationButton = document.getElementById('set-notification') as HTMLButtonElement;
  const errorMessage = document.getElementById('custom-time-error') as HTMLDivElement;

  const inputs = [daysInput, hoursInput, minutesInput, secondsInput];

  const totalMilliseconds = 
    (parseInt(daysInput.value) || 0) * 86400000 +
    (parseInt(hoursInput.value) || 0) * 3600000 +
    (parseInt(minutesInput.value) || 0) * 60000 +
    (parseInt(secondsInput.value) || 0) * 1000;

  const currentEvent = useStore.getState().currentEvent;
  if (!currentEvent) {
    setNotificationButton.disabled = true;
    errorMessage.textContent = 'No event selected.';
    errorMessage.style.display = 'block';
    return;
  }

  const remainingTime = currentEvent.endTime - Date.now();

  // Only validate if user has entered some value
  if (totalMilliseconds > 0) {
    const isValid = totalMilliseconds < remainingTime;

    inputs.forEach(input => {
      input.style.borderColor = isValid ? '' : 'red';
    });

    setNotificationButton.disabled = !isValid;
    errorMessage.textContent = isValid ? '' : 'Notification time cannot exceed the remaining time.';
    errorMessage.style.display = isValid ? 'none' : 'block';
  } else {
    // Reset styles if no value entered
    inputs.forEach(input => {
      input.style.borderColor = '';
    });
    setNotificationButton.disabled = true;
    errorMessage.style.display = 'none';
  }
}
