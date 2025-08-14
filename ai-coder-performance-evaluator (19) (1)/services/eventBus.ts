type Listener = (...args: any[]) => void;

class EventBus {
  private listeners: { [event: string]: Listener[] } = {};

  subscribe(event: string, listener: Listener): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);

    return () => {
      this.unsubscribe(event, listener);
    };
  }

  unsubscribe(event: string, listener: Listener): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  publish(event: string, ...args: any[]): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach(listener => listener(...args));
  }
}

const eventBus = new EventBus();
export default eventBus;
