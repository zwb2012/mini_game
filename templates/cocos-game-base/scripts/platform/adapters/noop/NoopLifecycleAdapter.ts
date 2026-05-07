export type LifecycleState = 'foreground' | 'background';

export class NoopLifecycleAdapter {
  private state: LifecycleState = 'foreground';
  getState(): LifecycleState { return this.state; }
  toForeground(): void { this.state = 'foreground'; }
  toBackground(): void { this.state = 'background'; }
}
