export type GameStage = 'boot' | 'shell' | 'session';

export class GameState {
  private stage: GameStage = 'boot';

  getStage(): GameStage {
    return this.stage;
  }

  moveTo(nextStage: GameStage): void {
    this.stage = nextStage;
  }
}
