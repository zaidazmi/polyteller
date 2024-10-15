import { useStore } from '../store/store';
import { NotificationSetting, PolymarketEvent } from '../types';
import { formatFullNotificationTime, formatDate } from '../utils/dateUtils';
import { log } from '../utils/logUtils';

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

      groupedNotifications.forEach((eventNotifications, eventId) => {
        const event = eventMap.get(eventId);
        if (event) {
          const eventElement = createEventElement(event, eventNotifications);
          allNotificationsElement.appendChild(eventElement);
        }
      });

      // Add event listeners for delete buttons
      const deleteButtons = document.querySelectorAll('.delete-notification');
      deleteButtons.forEach(button => {
        button.addEventListener('click', deleteNotification);
      });

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
    <h2>${event.title}</h2>
    <div class="event-countdown" data-end-time="${event.endTime}"></div>
    <ul class="notifications-list"></ul>
  `;

  const notificationsList = eventElement.querySelector('.notifications-list');
  if (notificationsList) {
    notifications.forEach(notification => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="notification-time">${formatFullNotificationTime(notification.minutesBefore)}</span>
        <span class="notification-date">${formatDate(new Date(event.endTime - notification.minutesBefore * 60 * 1000))}</span>
        <button class="delete-notification" data-event-id="${event.id}" data-minutes-before="${notification.minutesBefore}">Delete</button>
      `;
      notificationsList.appendChild(li);
    });
  }

  return eventElement;
}

function deleteNotification(event: Event) {
  const button = event.target as HTMLButtonElement;
  const eventId = button.getAttribute('data-event-id');
  const minutesBefore = parseInt(button.getAttribute('data-minutes-before') || '0', 10);

  if (eventId) {
    chrome.runtime.sendMessage({
      type: 'REMOVE_NOTIFICATION_ALARM',
      data: { eventId, minutesBefore }
    }, (response) => {
      if (response.success || response.alreadyTriggered) {
        displayAllNotifications();
      }
    });
  }
}

function startCountdowns() {
  const countdownElements = document.querySelectorAll('.event-countdown');
  countdownElements.forEach(element => {
    const endTime = parseInt(element.getAttribute('data-end-time') || '0', 10);
    updateCountdown(element as HTMLElement, endTime);
    setInterval(() => updateCountdown(element as HTMLElement, endTime), 1000);
  });
}

function updateCountdown(element: HTMLElement, endTime: number) {
  const now = Date.now();
  const timeLeft = endTime - now;

  if (timeLeft > 0) {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    element.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else {
    element.textContent = 'Event ended';
  }
}

// Make sure to call displayAllNotifications when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, displaying notifications');
  displayAllNotifications();
});

// Listen for updates from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'NOTIFICATIONS_UPDATED') {
    displayAllNotifications();
  }
});
