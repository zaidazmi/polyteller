/**
 * Notification management functions for the Polyteller popup.
 * This file contains functions for setting, displaying, and managing notifications.
 */

import { PolymarketEvent, NotificationSetting } from '../../types';
import { log } from '../../utils/logUtils';
import { formatDate, formatFullNotificationTime } from '../../utils/dateUtils';
import { displayStatus } from '../utils';
import { useStore } from '../../store/store';

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

  const events = useStore.getState().events;
  if (events.length > 0) {
    const currentEvent = events[0]; // Assuming we're working with the first event
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
    }, (response) => {
      if (response.success) {
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
  const events = useStore.getState().events;
  const notifications = useStore.getState().notifications;
  log('Popup', 'Displaying notifications:', notifications);
  if (notificationsList && events.length > 0) {
    const currentEvent = events[0]; // Assuming we're working with the first event
    notificationsList.innerHTML = '';
    notifications.filter((n: NotificationSetting) => n.eventId === currentEvent.id).forEach((notification: NotificationSetting, index: number) => {
      const li = document.createElement('li');
      const notificationTime = new Date(currentEvent.endTime - notification.minutesBefore * 60 * 1000);
      
      li.innerHTML = `
        <div class="notification-info">
          <span class="notification-time">${formatFullNotificationTime(notification.minutesBefore)}</span>
          <span class="notification-date">${formatDate(notificationTime)}</span>
          <a href="${notification.eventUrl}" target="_blank" class="event-link">${notification.eventTitle}</a>
        </div>
        <button class="delete-notification" data-index="${index}" aria-label="Delete notification">
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
    log('Popup', 'Unable to display notifications: no events or notificationsList not found');
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
  const index = parseInt(button.getAttribute('data-index') || '-1');
  log('Popup', `Attempting to delete notification at index: ${index}`);
  
  const events = useStore.getState().events;
  const notifications = useStore.getState().notifications;
  if (index !== -1 && events.length > 0) {
    const currentEvent = events[0]; // Assuming we're working with the first event
    const deletedNotification = notifications.filter((n: NotificationSetting) => n.eventId === currentEvent.id)[index];
    log('Popup', `Notification to delete:`, deletedNotification);
    
    chrome.runtime.sendMessage({
      type: 'REMOVE_NOTIFICATION_ALARM',
      data: deletedNotification
    }, async (response) => {
      log('Popup', `Received response from background:`, response);
      if (response.success || response.alreadyTriggered) {
        useStore.getState().removeNotification(deletedNotification.eventId, deletedNotification.minutesBefore);
        displayNotifications();
        displayStatus('Notification deleted successfully!');
      } else {
        displayStatus('Error deleting notification. Please try again.');
      }
    });
  } else {
    log('Popup', 'Invalid index for deletion or no current event');
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