export class ConfigRegistry {
  private entries = new Map<string, unknown>();

  set(key: string, value: unknown): void {
    this.entries.set(key, value);
  }

  get<T>(key: string): T {
    const value = this.entries.get(key);
    if (value === undefined) {
      throw new Error(`config-missing:${key}`);
    }
    return value as T;
  }
}
