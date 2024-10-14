/**
 * Notification management functions for the Polyteller popup.
 * This file contains functions for setting, displaying, and managing notifications.
 */

import { PolymarketEvent, NotificationSetting } from '../../types';
import { saveNotificationSetting, deleteNotificationSetting } from '../../utils/storageUtils';
import { log } from '../../utils/logUtils';
import { formatDate, formatFullNotificationTime } from '../../utils/dateUtils';
import { displayStatus } from '../utils';

let currentEvent: PolymarketEvent | null = null;
let currentNotifications: NotificationSetting[] = [];

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

  if (currentEvent) {
    const now = Date.now();
    const notificationTime = currentEvent.endTime - minutesBefore * 60 * 1000;

    if (notificationTime <= now) {
      displayStatus('Cannot set notification for a time that has already passed.');
      return;
    }

    const notificationSetting: NotificationSetting = {
      eventId: currentEvent.id,
      minutesBefore: minutesBefore
    };

    saveNotificationSetting(notificationSetting).then((saved) => {
      if (saved) {
        chrome.runtime.sendMessage({
          type: 'SCHEDULE_NOTIFICATION',
          data: notificationSetting
        }, (response) => {
          if (response.success) {
            currentNotifications.push(notificationSetting);
            displayStatus('Notification set successfully!');
            displayNotifications();
          } else {
            displayStatus('Failed to set notification. Please try again.');
          }
        });
      } else {
        displayStatus('A notification for this time already exists.');
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
  log('Popup', 'Displaying notifications:', currentNotifications);
  if (notificationsList && currentEvent) {
    notificationsList.innerHTML = '';
    currentNotifications.forEach((notification, index) => {
      const li = document.createElement('li');
      const notificationTime = new Date((currentEvent?.endTime ?? Date.now()) - notification.minutesBefore * 60 * 1000);
      
      li.innerHTML = `
        <div class="notification-info">
          <span class="notification-time">${formatFullNotificationTime(notification.minutesBefore)}</span>
          <span class="notification-date">${formatDate(notificationTime)}</span>
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
    log('Popup', 'Unable to display notifications: currentEvent is null or notificationsList not found');
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
  
  if (index !== -1 && currentEvent) {
    const deletedNotification = currentNotifications[index];
    log('Popup', `Notification to delete:`, deletedNotification);
    
    chrome.runtime.sendMessage({
      type: 'REMOVE_NOTIFICATION_ALARM',
      data: deletedNotification
    }, async (response) => {
      log('Popup', `Received response from background:`, response);
      if (response.success || response.alreadyTriggered) {
        currentNotifications.splice(index, 1);
        await deleteNotificationSetting(deletedNotification);
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
  if (currentEvent && currentEvent.id === triggeredNotification.eventId) {
    currentNotifications = currentNotifications.filter(
      notification => notification.minutesBefore !== triggeredNotification.minutesBefore
    );
    displayNotifications();
  }
}

/**
 * Sets the current event for notification management.
 * @param event - The current Polymarket event
 */
export function setCurrentEvent(event: PolymarketEvent) {
  currentEvent = event;
}

/**
 * Sets the current list of notifications.
 * @param notifications - The list of current notifications
 */
export function setCurrentNotifications(notifications: NotificationSetting[]) {
  currentNotifications = notifications;
}
