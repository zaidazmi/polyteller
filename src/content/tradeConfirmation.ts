import { log } from '../utils/logUtils';

// State management class
class TradeConfirmationState {
  private static instance: TradeConfirmationState;
  private _isEnabled: boolean = true;
  private stateChangeCallbacks: ((enabled: boolean) => void)[] = [];

  private constructor() {
    this.loadInitialState();
    this.setupMessageListener();
  }

  static getInstance(): TradeConfirmationState {
    if (!TradeConfirmationState.instance) {
      TradeConfirmationState.instance = new TradeConfirmationState();
    }
    return TradeConfirmationState.instance;
  }

  private async loadInitialState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('enableTradeConfirmation');
      this._isEnabled = result.enableTradeConfirmation !== false;
      log('TradeConfirmation', `Initial state loaded: ${this._isEnabled}`);
    } catch (error) {
      log('TradeConfirmation', 'Error loading initial state:', error);
    }
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'updateTradeConfirmation') {
        this.setEnabled(message.enabled);
        sendResponse({ received: true });
      }
      return true;
    });
  }

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  private async setEnabled(value: boolean): Promise<void> {
    if (this._isEnabled === value) return;

    this._isEnabled = value;
    log('TradeConfirmation', `State updated: ${value}`);

    try {
      await chrome.storage.local.set({ enableTradeConfirmation: value });
      log('TradeConfirmation', `State persisted: ${value}`);
      this.notifyStateChange();
    } catch (error) {
      log('TradeConfirmation', 'Error persisting state:', error);
    }
  }

  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => callback(this._isEnabled));
  }

  onStateChange(callback: (enabled: boolean) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
    };
  }
}

// Export the state instance
export const tradeConfirmationState = TradeConfirmationState.getInstance();

// Export the styling function (unchanged)
export function applyTradeConfirmationStyles(dialog: HTMLElement) {
  dialog.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
  dialog.style.backgroundColor = 'var(--card-background, #FFFFFF)';
  dialog.style.borderRadius = '12px';
  dialog.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
  dialog.style.color = 'var(--text-color, #1A1B25)';
  dialog.style.fontSize = '14px';
  
  const buttons = dialog.querySelectorAll('button');
  buttons.forEach(button => {
    button.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    button.style.borderRadius = '6px';
    button.style.padding = '10px 16px';
    button.style.fontSize = '14px';
    button.style.fontWeight = '600';
    button.style.cursor = 'pointer';
    button.style.transition = 'background-color 0.2s ease';
  });
}
