// Minimal ECS. Map-based component storage — pick archetypes later only if
// profiling shows query cost matters. Systems are plain functions; no class
// hierarchy unless one earns its keep.

export type EntityId = number;

export type System = (world: World, dtSec: number) => void;

export class World {
  private nextId: EntityId = 1;
  private readonly entities = new Set<EntityId>();
  private readonly components = new Map<string, Map<EntityId, unknown>>();

  createEntity(): EntityId {
    const id = this.nextId++;
    this.entities.add(id);
    return id;
  }

  destroyEntity(id: EntityId): void {
    if (!this.entities.delete(id)) return;
    for (const store of this.components.values()) {
      store.delete(id);
    }
  }

  hasEntity(id: EntityId): boolean {
    return this.entities.has(id);
  }

  addComponent<T>(id: EntityId, key: string, data: T): void {
    if (!this.entities.has(id)) {
      throw new Error(`addComponent: entity ${id} does not exist`);
    }
    let store = this.components.get(key);
    if (!store) {
      store = new Map();
      this.components.set(key, store);
    }
    store.set(id, data);
  }

  getComponent<T>(id: EntityId, key: string): T | undefined {
    return this.components.get(key)?.get(id) as T | undefined;
  }

  hasComponent(id: EntityId, key: string): boolean {
    return this.components.get(key)?.has(id) ?? false;
  }

  removeComponent(id: EntityId, key: string): void {
    this.components.get(key)?.delete(id);
  }

  query(...keys: string[]): EntityId[] {
    if (keys.length === 0) return Array.from(this.entities);

    const stores: Array<Map<EntityId, unknown>> = [];
    for (const k of keys) {
      const s = this.components.get(k);
      if (!s) return [];
      stores.push(s);
    }

    // Walk the smallest store; cheaper than walking all entities.
    let smallest = stores[0]!;
    for (const s of stores) {
      if (s.size < smallest.size) smallest = s;
    }

    const result: EntityId[] = [];
    outer: for (const id of smallest.keys()) {
      for (const s of stores) {
        if (!s.has(id)) continue outer;
      }
      result.push(id);
    }
    return result;
  }
}
