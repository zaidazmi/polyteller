/**
 * Notification management functions for the Polyteller popup.
 * This file contains functions for setting, displaying, and managing notifications.
 */

import { PolymarketEvent, NotificationSetting } from '../../types';
import { log } from '../../utils/logUtils';
import { formatDate, formatFullNotificationTime } from '../../utils/dateUtils';
import { displayStatus } from '../utils';
import { useStore } from '../../store/store';
import { loadNotifications } from '../popup';

/**
 * Sets a new notification for the current event.
 */
export function setNotification() {
  const notificationTimeSelect = document.getElementById('notification-time') as HTMLSelectElement;
  let minutesBefore: number;
  if (notificationTimeSelect.value === 'custom') {
    const days = parseInt((document.getElementById('custom-days') as HTMLInputElement).value) || 0;
    const hours = parseInt((document.getElementById('custom-hours') as HTMLInputElement).value) || 0;
    const minutes = parseInt((document.getElementById('custom-minutes') as HTMLInputElement).value) || 0;
    const seconds = parseInt((document.getElementById('custom-seconds') as HTMLInputElement).value) || 0;

    minutesBefore = (days * 24 * 60) + (hours * 60) + minutes + (seconds / 60);
  } else {
    minutesBefore = parseInt(notificationTimeSelect.value);
  }

  const currentEvent = useStore.getState().currentEvent;
  if (currentEvent) {
    const now = Date.now();
    const notificationTime = currentEvent.endTime - minutesBefore * 60 * 1000;

    if (notificationTime <= now) {
      displayStatus('Cannot set notification for a time that has already passed.');
      return;
    }

    const notificationSetting: NotificationSetting = {
      eventId: currentEvent.id,
      minutesBefore: minutesBefore,
      eventTitle: currentEvent.title,
      eventUrl: currentEvent.url
    };

    const existingNotification = useStore.getState().notifications.find(
      (n: NotificationSetting) => n.eventId === notificationSetting.eventId && n.minutesBefore === notificationSetting.minutesBefore
    );

    if (existingNotification) {
      displayStatus('A notification for this time already exists.');
      return;
    }

    useStore.getState().addNotification(notificationSetting);
    chrome.runtime.sendMessage({
      type: 'SCHEDULE_NOTIFICATION',
      data: notificationSetting
    }, async (response) => {
      if (response.success) {
        await loadNotifications();
        displayStatus('Notification set successfully!');
        displayNotifications();
      } else {
        displayStatus('Failed to set notification. Please try again.');
      }
    });
  } else {
    displayStatus('No event selected. Please select an event first.');
  }
}

/**
 * Displays the list of current notifications.
 */
export function displayNotifications() {
  const notificationsList = document.getElementById('notifications-list');
  const currentEvent = useStore.getState().currentEvent;
  const notifications = useStore.getState().notifications;
  log('Popup', 'Displaying notifications:', notifications);
  if (notificationsList && currentEvent) {
    notificationsList.innerHTML = '';
    notifications.forEach((notification: NotificationSetting) => {
      const li = document.createElement('li');
      const notificationTime = new Date(currentEvent.endTime - notification.minutesBefore * 60 * 1000);
      
      li.innerHTML = `
        <div class="notification-info">
          <span class="notification-time">${formatFullNotificationTime(notification.minutesBefore)}</span>
          <span class="notification-date">${formatDate(notificationTime)}</span>
          <a href="${notification.eventUrl}" target="_blank" class="event-link">${notification.eventTitle}</a>
        </div>
        <button class="delete-notification" 
                data-event-id="${notification.eventId}" 
                data-minutes-before="${notification.minutesBefore}" 
                aria-label="Delete notification">
          <span class="delete-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </span>
        </button>
      `;
      notificationsList.appendChild(li);
    });
    
    const deleteButtons = document.querySelectorAll('.delete-notification');
    deleteButtons.forEach(button => {
      button.addEventListener('click', deleteNotification);
    });
  } else {
    log('Popup', 'Unable to display notifications: no event or notificationsList not found');
    if (notificationsList) {
      notificationsList.innerHTML = '<li>No event selected or notifications available.</li>';
    }
  }
}

/**
 * Deletes a notification from the list and storage.
 * @param event - The click event on the delete button
 */
export async function deleteNotification(event: Event) {
  const button = event.currentTarget as HTMLButtonElement;
  const eventId = button.getAttribute('data-event-id');
  const minutesBefore = parseFloat(button.getAttribute('data-minutes-before') || '0');
  log('Popup', `Attempting to delete notification: eventId=${eventId}, minutesBefore=${minutesBefore}`);
  
  if (eventId && !isNaN(minutesBefore)) {
    const deletedNotification = { eventId, minutesBefore };
    log('Popup', `Notification to delete:`, deletedNotification);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REMOVE_NOTIFICATION_ALARM',
        data: deletedNotification
      });
      
      log('Popup', `Received response from background:`, response);
      if (response.success) {
        useStore.getState().removeNotification(eventId, minutesBefore);
        await displayNotifications();
        displayStatus('Notification deleted successfully!');
      } else {
        displayStatus('Error deleting notification. Please try again.');
      }
    } catch (error) {
      log('Popup', 'Error sending message to background:', error);
      displayStatus('Error communicating with background. Please try again.');
    }
  } else {
    log('Popup', 'Invalid notification data for deletion');
    displayStatus('Error: Invalid notification data');
  }
}

/**
 * Removes a triggered notification from the list.
 * @param triggeredNotification - The notification that was triggered
 */
export function removeTriggeredNotificationFromList(triggeredNotification: { eventId: string, minutesBefore: number }) {
  useStore.getState().removeNotification(triggeredNotification.eventId, triggeredNotification.minutesBefore);
  displayNotifications();
}
