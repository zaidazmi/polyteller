import { useStore } from '../store/store';
import { NotificationSetting, PolymarketEvent } from '../types';
import { formatFullNotificationTime, formatDate } from '../utils/dateUtils';
import { log } from '../utils/logUtils';
import { displayStatus } from './utils';
import { convertToLocalTime, formatLocalTime } from '../utils/timezoneUtils';
import { CountdownManager } from '../utils/CountdownManager';
import { formatAllNotificationsCountdown } from '../utils/countdownFormatters';

function displayAllNotifications() {
  const allNotificationsElement = document.getElementById('all-notifications');
  
  // Fetch notifications from the background script
  chrome.runtime.sendMessage({ type: 'GET_STORED_NOTIFICATIONS' }, (response) => {
    const notifications = response.notifications;
    const events = useStore.getState().events;

    console.log('Displaying all notifications:', notifications);
    console.log('Events:', events);

    if (allNotificationsElement) {
      allNotificationsElement.innerHTML = '';

      if (!notifications || notifications.length === 0) {
        allNotificationsElement.innerHTML = '<p>No notifications set.</p>';
        return;
      }

      const eventMap = new Map<string, PolymarketEvent>();
      events.forEach(event => eventMap.set(event.id, event));

      const groupedNotifications = groupNotificationsByEvent(notifications, eventMap);

      // Sort events by endTime
      const sortedEvents = Array.from(groupedNotifications.entries())
        .sort(([eventIdA, notificationsA], [eventIdB, notificationsB]) => {
          const eventA = eventMap.get(eventIdA);
          const eventB = eventMap.get(eventIdB);
          if (eventA && eventB) {
            return eventA.endTime - eventB.endTime;
          }
          return 0;
        });

      sortedEvents.forEach(([eventId, eventNotifications]) => {
        const event = eventMap.get(eventId);
        if (event) {
          const eventElement = createEventElement(event, eventNotifications);
          allNotificationsElement.appendChild(eventElement);
        }
      });

      // After populating the notifications
      addDeleteEventListeners();

      // Start countdown timers
      startCountdowns();
    }
  });
}

function groupNotificationsByEvent(notifications: NotificationSetting[], eventMap: Map<string, PolymarketEvent>) {
  const groupedNotifications = new Map<string, NotificationSetting[]>();
  notifications.forEach(notification => {
    if (eventMap.has(notification.eventId)) {
      const eventNotifications = groupedNotifications.get(notification.eventId) || [];
      eventNotifications.push(notification);
      groupedNotifications.set(notification.eventId, eventNotifications);
    }
  });
  return groupedNotifications;
}

function createEventElement(event: PolymarketEvent, notifications: NotificationSetting[]) {
  const eventElement = document.createElement('div');
  eventElement.className = 'event-notifications';
  eventElement.setAttribute('data-event-id', event.id);
  eventElement.innerHTML = `
    <h2><a href="${event.url}" target="_blank" class="event-link">${event.title}</a></h2>
    <div class="event-countdown" data-end-time="${event.endTime}"></div>
    <ul class="notifications-list"></ul>
  `;

  const notificationsList = eventElement.querySelector('.notifications-list');
  if (notificationsList) {
    notifications.forEach(notification => {
      const notificationTime = event.endTime - notification.minutesBefore * 60 * 1000;
      const localNotificationTime = convertToLocalTime(notificationTime);
      
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="notification-info">
          <span class="notification-time">${formatFullNotificationTime(notification.minutesBefore)}</span>
          <span class="notification-date">${formatLocalTime(localNotificationTime)}</span>
        </div>
        <button class="delete-notification" data-event-id="${event.id}" data-minutes-before="${notification.minutesBefore}" aria-label="Delete notification">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      `;
      notificationsList.appendChild(li);
    });
  }

  return eventElement;
}

async function deleteNotification(event: Event) {
  const target = event.target as HTMLElement;
  const button = target.closest('.delete-notification') as HTMLButtonElement;
  
  if (!button) return;

  const eventId = button.getAttribute('data-event-id');
  const minutesBefore = parseFloat(button.getAttribute('data-minutes-before') || '0');

  log('All Notifications', `Attempting to delete notification: eventId=${eventId}, minutesBefore=${minutesBefore}`);
  
  if (eventId && !isNaN(minutesBefore)) {
    const deletedNotification = { eventId, minutesBefore };
    log('All Notifications', `Notification to delete:`, deletedNotification);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REMOVE_NOTIFICATION_ALARM',
        data: deletedNotification
      });
      
      log('All Notifications', `Received response from background:`, response);
      if (response.success) {
        useStore.getState().removeNotification(eventId, minutesBefore);
        await displayAllNotifications();
        displayStatus('Notification deleted successfully!');
      } else {
        displayStatus('Error deleting notification. Please try again.');
      }
    } catch (error) {
      log('All Notifications', 'Error sending message to background:', error);
      displayStatus('Error communicating with background. Please try again.');
    }
  } else {
    log('All Notifications', 'Invalid notification data for deletion');
    displayStatus('Error: Invalid notification data');
  }
}

function startCountdowns() {
  const countdownElements = document.querySelectorAll('.event-countdown');
  countdownElements.forEach(element => {
    const endTime = parseInt(element.getAttribute('data-end-time') || '0', 10);
    const eventId = element.closest('.event-notifications')?.getAttribute('data-event-id') || '';
    updateCountdown(element as HTMLElement, eventId, endTime);
  });
}

function updateCountdown(element: HTMLElement, eventId: string, endTime: number) {
  const countdownManager = CountdownManager.getInstance();
  countdownManager.registerEvent({ id: eventId, endTime } as PolymarketEvent);

  return countdownManager.subscribe(eventId, (timeLeft) => {
    if (timeLeft.hasEnded) {
      element.innerHTML = `
        <div class="countdown-segment" style="background-color: #FEE2E2; color: #991B1B;">
          <span class="countdown-number" style="color: #991B1B;">00:00</span>
          <span class="countdown-label">Event ended</span>
        </div>
      `;
    } else {
      element.innerHTML = formatAllNotificationsCountdown(timeLeft);
    }
  });
}

// Store unsubscribe functions
const countdownUnsubscribes = new Map<string, () => void>();

// Cleanup function
function cleanupCountdowns() {
  countdownUnsubscribes.forEach(unsubscribe => unsubscribe());
  countdownUnsubscribes.clear();
}

// Add cleanup on page unload
window.addEventListener('unload', cleanupCountdowns);

// Add this to the existing CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

// Make sure to call displayAllNotifications when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, displaying notifications');
  displayAllNotifications();
});

// Listen for updates from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'NOTIFICATIONS_UPDATED') {
    console.log('Received NOTIFICATIONS_UPDATED message, refreshing notifications');
    displayAllNotifications();
  }
});

function addDeleteEventListeners() {
  const deleteButtons = document.querySelectorAll('.delete-notification');
  deleteButtons.forEach(button => {
    button.addEventListener('click', deleteNotification);
  });
}

