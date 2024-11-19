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
import { convertToLocalTime, formatLocalTime } from '../../utils/timezoneUtils';

/**
 * Sets a new notification for the current event.
 */
export function setNotification() {
  const setNotificationButton = document.getElementById('set-notification') as HTMLButtonElement;
  const notificationTimeSelect = document.getElementById('notification-time') as HTMLSelectElement;
  
  // Disable button during processing
  setNotificationButton.disabled = true;
  
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
      setNotificationButton.classList.add('error');
      displayStatus('Cannot set notification for a time that has already passed.');
      setTimeout(() => {
        setNotificationButton.classList.remove('error');
        setNotificationButton.disabled = false;
      }, 500);
      return;
    }

    const notificationSetting: NotificationSetting = {
      eventId: currentEvent.id,
      minutesBefore: minutesBefore,
      eventTitle: currentEvent.title,
      eventUrl: currentEvent.url
    };

    chrome.runtime.sendMessage({
      type: 'SCHEDULE_NOTIFICATION',
      data: notificationSetting
    }, async (response) => {
      if (response.success) {
        setNotificationButton.classList.add('success');
        await loadNotifications();
        displayStatus('Notification set successfully!');
        displayNotifications();
      } else {
        setNotificationButton.classList.add('error');
        if (response.isDuplicate) {
          displayStatus('A notification for this time already exists.');
        } else {
          displayStatus(`Failed to set notification: ${response.error}`);
        }
      }

      // Reset button state after delay
      setTimeout(() => {
        setNotificationButton.classList.remove('success', 'error');
        setNotificationButton.disabled = false;
      }, 500);
    });
  } else {
    setNotificationButton.classList.add('error');
    displayStatus('No event selected. Please select an event first.');
    setTimeout(() => {
      setNotificationButton.classList.remove('error');
      setNotificationButton.disabled = false;
    }, 500);
  }
}

/**
 * Displays the list of current notifications.
 */
export function displayNotifications() {
  const currentEvent = useStore.getState().currentEvent;
  const notifications = useStore.getState().notifications;
  const notificationsList = document.getElementById('notifications-list');

  if (!notificationsList) return;

  if (!currentEvent || !notifications.length) {
    notificationsList.innerHTML = '<li>No notifications set for this event.</li>';
    return;
  }

  // Sort notifications by trigger time (earliest first)
  const sortedNotifications = [...notifications].sort((a, b) => {
    const aTime = currentEvent.endTime - (a.minutesBefore * 60 * 1000);
    const bTime = currentEvent.endTime - (b.minutesBefore * 60 * 1000);
    return aTime - bTime;  // Ascending order (earliest first)
  });

  // Display sorted notifications
  notificationsList.innerHTML = sortedNotifications.map(notification => {
    const triggerTime = currentEvent.endTime - (notification.minutesBefore * 60 * 1000);
    return `
      <li class="notification-item">
        <div class="notification-info">
          <div class="notification-time">${formatFullNotificationTime(notification.minutesBefore)}</div>
          <div class="notification-date">${formatLocalTime(new Date(triggerTime))}</div>
        </div>
        <button class="delete-notification" data-event-id="${notification.eventId}" data-minutes-before="${notification.minutesBefore}">
          <div class="delete-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </div>
        </button>
      </li>
    `;
  }).join('');

  // Add event listeners for delete buttons
  const deleteButtons = notificationsList.querySelectorAll('.delete-notification');
  deleteButtons.forEach(button => {
    button.addEventListener('click', deleteNotification);
  });
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
