import { GameState } from './GameState';
import { EventBus } from './EventBus';
import { SceneFlow } from './SceneFlow';
import { ConfigLoader } from './ConfigLoader';
import { UIRoot } from './UIRoot';

export interface AppServices {
  gameState: GameState; eventBus: EventBus; sceneFlow: SceneFlow; configLoader: ConfigLoader; uiRoot: UIRoot;
}

export class AppRoot {
  readonly gameState = new GameState();
  readonly eventBus = new EventBus();
  readonly sceneFlow = new SceneFlow();
  readonly configLoader = new ConfigLoader();
  readonly uiRoot = new UIRoot();

  getServices(): AppServices {
    return { gameState: this.gameState, eventBus: this.eventBus, sceneFlow: this.sceneFlow, configLoader: this.configLoader, uiRoot: this.uiRoot };
  }
}
