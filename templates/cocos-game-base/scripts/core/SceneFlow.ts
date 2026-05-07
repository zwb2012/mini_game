export type SceneRoute = 'start' | 'game' | 'result';
export interface SceneParams { route: SceneRoute; data?: Record<string, unknown>; }
export type SceneGuard = (from: SceneRoute, to: SceneRoute, params?: Record<string, unknown>) => boolean;

export class SceneFlow {
  private current: SceneRoute = 'start';
  private guards: SceneGuard[] = [];

  getCurrent(): SceneRoute { return this.current; }
  addGuard(guard: SceneGuard): void { this.guards.push(guard); }

  goTo(params: SceneParams): { success: boolean; reason?: string } {
    for (const guard of this.guards) {
      if (!guard(this.current, params.route, params.data)) return { success: false, reason: `guard rejected ${this.current} -> ${params.route}` };
    }
    this.current = params.route; return { success: true };
  }
}
