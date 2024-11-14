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
  private subscribers: Map<string, Set<(timeLeft: TimeRemaining) => void>> = new Map();
  private eventEndTimes: Map<string, number> = new Map();
  private rafId: number | null = null;
  private lastDisplayUpdate: number = 0;
  private lastBackgroundUpdate: number = 0;
  private readonly DISPLAY_INTERVAL = 1000;    // 1 second for visual updates
  private readonly BACKGROUND_INTERVAL = 30000; // 30 seconds for cleanup
  private visibilityState: 'visible' | 'hidden' = 'visible';

  private constructor() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  static getInstance(): CountdownManager {
    if (!this.instance) {
      this.instance = new CountdownManager();
    }
    return this.instance;
  }

  registerEvent(event: { id: string; endTime: number }) {
    this.eventEndTimes.set(event.id, event.endTime);
    this.startUpdates(); // Start animation frame if not running
  }

  private updateLoop = (timestamp: number) => {
    // Visual updates (every second)
    if (timestamp - this.lastDisplayUpdate >= this.DISPLAY_INTERVAL) {
      if (this.visibilityState === 'visible') {
        this.updateDisplays();
      }
      this.lastDisplayUpdate = timestamp;
    }

    // Background tasks (every 30 seconds)
    if (timestamp - this.lastBackgroundUpdate >= this.BACKGROUND_INTERVAL) {
      this.processBackgroundTasks();
      this.lastBackgroundUpdate = timestamp;
    }

    // Continue loop if we have subscribers
    if (this.subscribers.size > 0) {
      this.rafId = requestAnimationFrame(this.updateLoop);
    } else {
      this.stopUpdates();
    }
  };

  private startUpdates() {
    if (!this.rafId && this.subscribers.size > 0) {
      this.lastDisplayUpdate = performance.now();
      this.lastBackgroundUpdate = performance.now();
      this.rafId = requestAnimationFrame(this.updateLoop);
    }
  }

  private stopUpdates() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private handleVisibilityChange = () => {
    this.visibilityState = document.hidden ? 'hidden' : 'visible';
    if (this.visibilityState === 'visible') {
      this.updateDisplays(); // Immediate update when becoming visible
      this.startUpdates();   // Restart animation frame
    }
  };

  subscribe(eventId: string, callback: (timeLeft: TimeRemaining) => void): () => void {
    if (!this.subscribers.has(eventId)) {
      this.subscribers.set(eventId, new Set());
    }

    const subscribers = this.subscribers.get(eventId)!;
    subscribers.add(callback);

    // Start updates if not running
    this.startUpdates();

    // Immediate first update
    const endTime = this.eventEndTimes.get(eventId);
    if (endTime) {
      const timeLeft = this.calculateTimeLeft(endTime);
      callback(timeLeft);
    }

    return () => this.unsubscribe(eventId, callback);
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
      this.stopUpdates();
    }
  }

  cleanupAll() {
    this.eventEndTimes.clear();
    this.subscribers.clear();
    this.stopUpdates();
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

  private cleanup(eventId: string) {
    this.eventEndTimes.delete(eventId);
    this.subscribers.delete(eventId);
  }
} 