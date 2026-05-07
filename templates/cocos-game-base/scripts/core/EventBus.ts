export type EventHandler<T = unknown> = (payload: T) => void;

interface Subscription { handler: EventHandler; once: boolean; }

export class EventBus {
  private topics = new Map<string, Subscription[]>();

  publish<T>(event: string, payload: T): void {
    const subs = this.topics.get(event); if (!subs) return;
    for (const sub of [...subs]) {
      try { sub.handler(payload); } catch { /* isolate */ }
      if (sub.once) { const idx = subs.indexOf(sub); if (idx >= 0) subs.splice(idx, 1); }
    }
  }

  subscribe<T>(event: string, handler: EventHandler<T>): () => void {
    const subs = this.topics.get(event) ?? []; const entry: Subscription = { handler: handler as EventHandler, once: false };
    subs.push(entry); this.topics.set(event, subs); return () => this.unsubscribe(event, entry);
  }

  once<T>(event: string, handler: EventHandler<T>): void {
    const subs = this.topics.get(event) ?? []; subs.push({ handler: handler as EventHandler, once: true }); this.topics.set(event, subs);
  }

  unsubscribe(event: string, sub: Subscription): void {
    const subs = this.topics.get(event); if (!subs) return; const idx = subs.indexOf(sub); if (idx >= 0) subs.splice(idx, 1);
  }

  clear(event?: string): void { if (event) this.topics.delete(event); else this.topics.clear(); }
}
