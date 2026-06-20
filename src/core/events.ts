type Listener<T> = (payload: T) => void;

export class TypedEventBus<EventMap> {
  private listeners = new Map<keyof EventMap, Set<Listener<unknown>>>();

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<unknown>);
    return () => {
      set!.delete(listener as Listener<unknown>);
    };
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      (listener as Listener<EventMap[K]>)(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const GameEvents = {
  SceneReady: 'SceneReady',
  PlayerJumped: 'PlayerJumped',
  PlayerLanded: 'PlayerLanded',
  DamageDealt: 'DamageDealt',
  EntityKilled: 'EntityKilled',
  RunStarted: 'RunStarted',
  RoomCleared: 'RoomCleared',
} as const;

export interface GameEventMap {
  [GameEvents.SceneReady]: { scene: string };
  [GameEvents.PlayerJumped]: { entityId: number };
  [GameEvents.PlayerLanded]: { entityId: number };
  [GameEvents.DamageDealt]: { source: number; target: number; amount: number };
  [GameEvents.EntityKilled]: { entityId: number };
  [GameEvents.RunStarted]: { seed: number };
  [GameEvents.RoomCleared]: { roomId: string };
}

export const eventBus = new TypedEventBus<GameEventMap>();
