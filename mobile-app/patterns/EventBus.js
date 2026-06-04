class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventName, listener) {
    const listeners = this.listeners.get(eventName) || new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);

    return () => this.unsubscribe(eventName, listener);
  }

  unsubscribe(eventName, listener) {
    const listeners = this.listeners.get(eventName);
    if (!listeners) return;

    listeners.delete(listener);
    if (listeners.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  publish(eventName, payload) {
    const listeners = this.listeners.get(eventName);
    if (!listeners) return;

    listeners.forEach((listener) => listener(payload));
  }
}

export const AppEvents = {
  AUTH_CHANGED: 'auth:changed',
  AUTH_CLEARED: 'auth:cleared',
  REWARD_CLAIMED: 'reward:claimed',
  MARKET_LISTING_CREATED: 'market:listing-created',
};

export default new EventBus();
