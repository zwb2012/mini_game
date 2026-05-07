export interface ConfigSource { domain: string; load(): Record<string, unknown>; }

export class ConfigLoader {
  private sources = new Map<string, ConfigSource>();
  private cache = new Map<string, Record<string, unknown>>();

  registerSource(source: ConfigSource): void { this.sources.set(source.domain, source); }

  get<T = unknown>(domain: string, key: string, defaultValue?: T): T {
    if (!this.cache.has(domain)) {
      const source = this.sources.get(domain);
      if (!source) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`ConfigLoader: missing source for domain "${domain}"`);
      }
      this.cache.set(domain, source.load());
    }
    const dc = this.cache.get(domain)!;
    return (key in dc ? dc[key] : defaultValue) as T;
  }

  refresh(domain: string): void { this.cache.delete(domain); }
}
