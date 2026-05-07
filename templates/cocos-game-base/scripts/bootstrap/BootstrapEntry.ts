import { AppRoot, AppServices } from '../core/AppRoot';

export interface PlatformAdapters {
  ad?: unknown; storage?: unknown; login?: unknown; analytics?: unknown; lifecycle?: unknown;
}

export function bootstrap(adapters?: PlatformAdapters): AppServices {
  const app = new AppRoot();
  app.gameState.setPhase('boot');
  app.eventBus.publish('app:boot', { timestamp: Date.now() });
  if (adapters?.lifecycle) app.eventBus.publish('platform:lifecycle:ready', { adapter: adapters.lifecycle });
  app.gameState.setPhase('menu');
  app.eventBus.publish('app:ready', { services: app.getServices() });
  return app.getServices();
}
