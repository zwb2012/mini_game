export class ServiceContainer {
  private services = new Map<string, unknown>();

  register(name: string, service: unknown): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`service-not-found:${name}`);
    }
    return service as T;
  }
}
