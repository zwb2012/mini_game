export type EventHandler = (payload: unknown) => void;

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  publish(eventName: string, payload: unknown): void {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.forEach((handler) => handler(payload));
  }

  subscribe(eventName: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventName) ?? [];
    this.handlers.set(eventName, [...handlers, handler]);
  }
}
