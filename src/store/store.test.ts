import { useStore } from './store';
import { PolymarketEvent, NotificationSetting } from '../types';

describe('Store Management', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    useStore.setState({
      events: [],
      notifications: [],
      currentEvent: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should add an event', () => {
    const event: PolymarketEvent = {
      id: '1',
      title: 'Test Event',
      endTime: Date.now() + 1000000,
      endDate: '2023-05-01',
      timezone: 'UTC',
      url: 'https://example.com',
      isResolved: false
    };

    useStore.getState().addEvent(event);
    expect(useStore.getState().events).toContainEqual(event);
    expect(useStore.getState().currentEvent).toEqual(event);
  });

  it('should remove an event', () => {
    const event: PolymarketEvent = {
      id: '1',
      title: 'Test Event',
      endTime: Date.now() + 1000000,
      endDate: '2023-05-01',
      timezone: 'UTC',
      url: 'https://example.com',
      isResolved: false
    };

    useStore.getState().addEvent(event);
    useStore.getState().removeEvent('1');
    expect(useStore.getState().events).not.toContainEqual(event);
  });

  it('should add a notification', () => {
    const notification: NotificationSetting = {
      eventId: '1',
      minutesBefore: 30,
      eventTitle: 'Test Event',
      eventUrl: 'https://example.com',
    };

    useStore.getState().addNotification(notification);
    expect(useStore.getState().notifications).toContainEqual(notification);
  });

  it('should remove a notification', () => {
    const notification: NotificationSetting = {
      eventId: '1',
      minutesBefore: 30,
      eventTitle: 'Test Event',
      eventUrl: 'https://example.com',
    };

    useStore.getState().addNotification(notification);
    useStore.getState().removeNotification('1', 30);
    expect(useStore.getState().notifications).not.toContainEqual(notification);
  });

  it('should set notifications', () => {
    const notifications: NotificationSetting[] = [
      {
        eventId: '1',
        minutesBefore: 30,
        eventTitle: 'Test Event 1',
        eventUrl: 'https://example.com/1',
      },
      {
        eventId: '2',
        minutesBefore: 60,
        eventTitle: 'Test Event 2',
        eventUrl: 'https://example.com/2',
      },
    ];

    useStore.getState().setNotifications(notifications);
    expect(useStore.getState().notifications).toEqual(notifications);
  });
});
