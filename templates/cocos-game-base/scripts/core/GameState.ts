export type GamePhase = 'boot' | 'menu' | 'playing' | 'paused' | 'result';

export interface GameStateSnapshot {
  phase: GamePhase; score: number; sessionId: string; timestamp: number; custom: Record<string, unknown>;
}

export class GameState {
  private phase: GamePhase = 'boot';
  private score = 0;
  private sessionId = '';
  private custom = new Map<string, unknown>();

  getPhase(): GamePhase { return this.phase; }
  setPhase(phase: GamePhase, reason?: string): void {
    const prev = this.phase; this.phase = phase;
    this.notify('phaseChange', { prev, next: phase, reason });
  }

  getScore(): number { return this.score; }
  addScore(delta: number): void { this.score += delta; this.notify('scoreChange', { delta, total: this.score }); }
  resetScore(): void { this.score = 0; }

  getSessionId(): string { return this.sessionId; }
  startSession(id: string): void { this.sessionId = id; this.phase = 'playing'; this.score = 0; this.notify('sessionStart', { sessionId: id }); }

  getCustom<T>(key: string): T | undefined { return this.custom.get(key) as T | undefined; }
  setCustom<T>(key: string, value: T): void { this.custom.set(key, value); this.notify('customChange', { key, value }); }

  snapshot(): GameStateSnapshot {
    return { phase: this.phase, score: this.score, sessionId: this.sessionId, timestamp: Date.now(), custom: Object.fromEntries(this.custom) };
  }
  restore(snap: GameStateSnapshot): void {
    this.phase = snap.phase; this.score = snap.score; this.sessionId = snap.sessionId;
    this.custom = new Map(Object.entries(snap.custom)); this.notify('stateRestored', { snapshot: snap });
  }

  query(): Readonly<{ phase: GamePhase; score: number; sessionId: string }> {
    return { phase: this.phase, score: this.score, sessionId: this.sessionId };
  }

  private listeners = new Map<string, Array<(data: unknown) => void>>();
  on(event: string, fn: (data: unknown) => void): void {
    const arr = this.listeners.get(event) ?? []; arr.push(fn); this.listeners.set(event, arr);
  }
  private notify(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(fn => { try { fn(data); } catch { /* isolate */ } });
  }
}
