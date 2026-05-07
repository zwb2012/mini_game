export interface LoginResult { success: boolean; userId?: string; reason?: string; }
export type LoginCallback = (result: LoginResult) => void;

export class NoopLoginAdapter {
  login(callback: LoginCallback): void { callback({ success: true, userId: 'noop-user-001' }); }
  logout(): void {}
  isLoggedIn(): boolean { return true; }
  getUserId(): string { return 'noop-user-001'; }
}
