type Listener<T extends any[] = any[]> = (...args: T) => void | Promise<void>;

export class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on<T extends any[]>(event: string, fn: Listener<T>) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn as Listener);
  }

  off<T extends any[]>(event: string, fn: Listener<T>) {
    this.listeners.get(event)?.delete(fn as Listener);
  }

  async emit<T extends any[]>(event: string, ...args: T) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of Array.from(set)) {
      try {
        await Promise.resolve((fn as Listener<T>)(...args));
      } catch (err) {
        // swallow by default; consumers can listen to 'error' channel
        const errHandlers = this.listeners.get('error');
        if (errHandlers && errHandlers.size) {
          for (const h of Array.from(errHandlers)) await Promise.resolve(h(err));
        }
      }
    }
  }
}

export default EventBus;
