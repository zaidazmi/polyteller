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
  private readonly DISPLAY_UPDATE_INTERVAL = 1000; // Always 1 second for display
  private readonly CALCULATION_UPDATE_INTERVAL = 30000; // 30 seconds for background calculations
  private displayInterval: number | null = null;
  private calculationInterval: number | null = null;
  private visibilityState: 'visible' | 'hidden' = 'visible';

  private constructor() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.startIntervals();
  }

  static getInstance(): CountdownManager {
    if (!this.instance) {
      this.instance = new CountdownManager();
    }
    return this.instance;
  }

  registerEvent(event: { id: string; endTime: number }) {
    this.eventEndTimes.set(event.id, event.endTime);
    if (!this.displayInterval || !this.calculationInterval) {
      this.startIntervals();
    }
  }

  subscribe(eventId: string, callback: (timeLeft: TimeRemaining) => void): () => void {
    if (!this.subscribers.has(eventId)) {
      this.subscribers.set(eventId, new Set());
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

  private startIntervals() {
    // Display updates every second for smooth countdown
    if (!this.displayInterval) {
      this.displayInterval = window.setInterval(() => {
        if (this.visibilityState === 'visible') {
          this.updateDisplays();
        }
      }, this.DISPLAY_UPDATE_INTERVAL);
    }

    // Background calculations at longer intervals
    if (!this.calculationInterval) {
      this.calculationInterval = window.setInterval(() => {
        this.processBackgroundTasks();
      }, this.CALCULATION_UPDATE_INTERVAL);
    }
  }

  private updateDisplays() {
    this.eventEndTimes.forEach((endTime, eventId) => {
      const timeLeft = this.calculateTimeLeft(endTime);
      this.subscribers.get(eventId)?.forEach(callback => {
        try {
          callback(timeLeft);
        } catch (error) {
          console.error(`Error in countdown subscriber for event ${eventId}:`, error);
        }
      });
    });
  }

  private processBackgroundTasks() {
    let needCleanup = false;
    
    this.eventEndTimes.forEach((endTime, eventId) => {
      const timeLeft = this.calculateTimeLeft(endTime);
      if (timeLeft.hasEnded) {
        this.cleanup(eventId);
        needCleanup = true;
      }
    });

    if (needCleanup && this.eventEndTimes.size === 0) {
      this.stopIntervals();
    }
  }

  private handleVisibilityChange = () => {
    this.visibilityState = document.hidden ? 'hidden' : 'visible';
    
    if (this.visibilityState === 'visible') {
      this.updateDisplays(); // Immediate update when becoming visible
    }
  };

  private stopIntervals() {
    if (this.displayInterval) {
      window.clearInterval(this.displayInterval);
      this.displayInterval = null;
    }
    if (this.calculationInterval) {
      window.clearInterval(this.calculationInterval);
      this.calculationInterval = null;
    }
  }

  cleanupAll() {
    this.eventEndTimes.clear();
    this.subscribers.clear();
    this.stopIntervals();
  }

  private calculateTimeLeft(endTime: number): TimeRemaining {
    const total = Math.max(0, endTime - Date.now());
    const hasEnded = total <= 0;

    return {
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((total % (1000 * 60)) / 1000),
      hasEnded
    };
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
    this.eventEndTimes.delete(eventId);
    this.subscribers.delete(eventId);
  }
} 