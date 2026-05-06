import { AppRoot } from '../core/AppRoot';
import { GameState } from '../core/GameState';

export class BootstrapEntry {
  boot(): string {
    const appRoot = new AppRoot();
    const gameState = new GameState();
    gameState.moveTo('shell');
    return `${appRoot.start()}:${gameState.getStage()}`;
  }
}
