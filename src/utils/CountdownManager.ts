import { PolymarketEvent } from '../types';
import { calculateTimeRemaining } from './dateUtils';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hasEnded: boolean;
}

export class CountdownManager {
  private static instance: CountdownManager;
  private intervals: Map<string, number> = new Map();
  private subscribers: Map<string, Set<(timeLeft: TimeRemaining) => void>> = new Map();
  private eventEndTimes: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): CountdownManager {
    if (!this.instance) {
      this.instance = new CountdownManager();
    }
    return this.instance;
  }

  registerEvent(event: PolymarketEvent) {
    this.eventEndTimes.set(event.id, event.endTime);
  }

  subscribe(eventId: string, callback: (timeLeft: TimeRemaining) => void): () => void {
    if (!this.subscribers.has(eventId)) {
      this.subscribers.set(eventId, new Set());
      this.startInterval(eventId);
    }

    const subscribers = this.subscribers.get(eventId)!;
    subscribers.add(callback);

    // Immediately call callback with current time
    const endTime = this.eventEndTimes.get(eventId);
    if (endTime) {
      const timeLeft = this.calculateTimeLeft(endTime);
      callback(timeLeft);
    }

    return () => this.unsubscribe(eventId, callback);
  }

  private startInterval(eventId: string) {
    if (this.intervals.has(eventId)) return;

    const interval = window.setInterval(() => {
      const endTime = this.eventEndTimes.get(eventId);
      if (!endTime) return;

      const timeLeft = this.calculateTimeLeft(endTime);
      this.notifySubscribers(eventId, timeLeft);

      if (timeLeft.hasEnded) {
        this.cleanup(eventId);
      }
    }, 1000) as unknown as number;

    this.intervals.set(eventId, interval);
  }

  private calculateTimeLeft(endTime: number): TimeRemaining {
    const { days, hours, minutes, seconds } = calculateTimeRemaining(endTime);
    const hasEnded = days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0;

    return {
      days,
      hours,
      minutes,
      seconds,
      hasEnded
    };
  }

  private notifySubscribers(eventId: string, timeLeft: TimeRemaining) {
    this.subscribers.get(eventId)?.forEach(callback => callback(timeLeft));
  }

  private unsubscribe(eventId: string, callback: (timeLeft: TimeRemaining) => void) {
    const subscribers = this.subscribers.get(eventId);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.cleanup(eventId);
      }
    }
  }

  private cleanup(eventId: string) {
    const interval = this.intervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(eventId);
    }
    this.subscribers.delete(eventId);
  }

  cleanupAll() {
    for (const eventId of this.intervals.keys()) {
      this.cleanup(eventId);
    }
    this.subscribers.clear();
    this.eventEndTimes.clear();
  }
} 