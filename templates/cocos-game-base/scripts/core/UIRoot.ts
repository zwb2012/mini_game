export type UILayer = 'hud' | 'modal' | 'loading';

export interface UIView {
  id: string; layer: UILayer; show(): void; hide(): void; destroy(): void;
}

export class UIRoot {
  private layers = new Map<UILayer, Map<string, UIView>>([
    ['hud', new Map()], ['modal', new Map()], ['loading', new Map()],
  ]);

  mount(view: UIView): void { this.layers.get(view.layer)?.set(view.id, view); }

  show(id: string): void {
    for (const layer of this.layers.values()) { const view = layer.get(id); if (view) { view.show(); return; } }
  }

  hide(id: string): void { for (const layer of this.layers.values()) layer.get(id)?.hide(); }
  hideLayer(layer: UILayer): void { this.layers.get(layer)?.forEach(v => v.hide()); }

  destroy(id: string): void {
    for (const layer of this.layers.values()) { const view = layer.get(id); if (view) { view.destroy(); layer.delete(id); return; } }
  }

  getViews(layer: UILayer): UIView[] { return [...(this.layers.get(layer)?.values() ?? [])]; }
}
