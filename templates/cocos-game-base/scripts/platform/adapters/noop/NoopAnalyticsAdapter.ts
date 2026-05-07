export interface AnalyticsEvent { name: string; properties?: Record<string, unknown>; timestamp?: number; }

export class NoopAnalyticsAdapter {
  private events: AnalyticsEvent[] = [];
  track(name: string, properties?: Record<string, unknown>): void {
    this.events.push({ name, properties, timestamp: Date.now() });
  }
  flush(): void { this.events = []; }
  getEventCount(): number { return this.events.length; }
}
