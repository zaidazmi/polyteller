import { TimeRemaining } from './CountdownManager';

export function formatCountdownDisplay(timeLeft: TimeRemaining): string {
  return `
    <div class="countdown-value">
      <span class="countdown-number">${timeLeft.days}</span>
      <span class="countdown-label">days</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${timeLeft.hours}</span>
      <span class="countdown-label">hours</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${timeLeft.minutes}</span>
      <span class="countdown-label">mins</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${timeLeft.seconds}</span>
      <span class="countdown-label">secs</span>
    </div>
  `;
}

export function formatAllNotificationsCountdown(timeLeft: TimeRemaining): string {
  return `
    <div class="countdown-segment">
      <span class="countdown-number">${timeLeft.days.toString().padStart(2, '0')}</span>
      <span class="countdown-label">days</span>
    </div>
    <span class="countdown-separator">:</span>
    <div class="countdown-segment">
      <span class="countdown-number">${timeLeft.hours.toString().padStart(2, '0')}</span>
      <span class="countdown-label">hours</span>
    </div>
    <span class="countdown-separator">:</span>
    <div class="countdown-segment">
      <span class="countdown-number">${timeLeft.minutes.toString().padStart(2, '0')}</span>
      <span class="countdown-label">mins</span>
    </div>
    <span class="countdown-separator">:</span>
    <div class="countdown-segment">
      <span class="countdown-number">${timeLeft.seconds.toString().padStart(2, '0')}</span>
      <span class="countdown-label">secs</span>
    </div>
  `;
} 