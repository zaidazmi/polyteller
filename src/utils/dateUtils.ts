export function getTimeRemaining(endTime: number): string {
    const total = endTime - Date.now();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
  
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function isValidTimestamp(timestamp: number): boolean {
  return !isNaN(timestamp) && isFinite(timestamp) && timestamp > 0;
}

export function formatFullNotificationTime(minutesBefore: number): string {
  const days = Math.floor(minutesBefore / 1440);
  const hours = Math.floor((minutesBefore % 1440) / 60);
  const minutes = Math.floor(minutesBefore % 60);
  const seconds = Math.floor((minutesBefore % 1) * 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') + ' before';
}

export function formatRemainingTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
  const hours = Math.floor(milliseconds / (1000 * 60 * 60)) % 24;
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days} Day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} Hr${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} Min`);
  if (seconds > 0) parts.push(`${seconds} Sec`);

  // If all parts are zero (shouldn't happen, but just in case)
  if (parts.length === 0) return "0 Sec";

  return parts.join(", ");
}
