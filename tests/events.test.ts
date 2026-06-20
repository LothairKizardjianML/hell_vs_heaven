import { describe, it, expect } from 'vitest';
import { TypedEventBus } from '../src/core/events';

describe('TypedEventBus', () => {
  it('delivers events to subscribers', () => {
    const bus = new TypedEventBus<{ ping: number }>();
    const received: number[] = [];
    bus.on('ping', (n) => received.push(n));
    bus.emit('ping', 1);
    bus.emit('ping', 2);
    expect(received).toEqual([1, 2]);
  });

  it('unsubscribes via returned disposer', () => {
    const bus = new TypedEventBus<{ ping: number }>();
    const received: number[] = [];
    const off = bus.on('ping', (n) => received.push(n));
    bus.emit('ping', 1);
    off();
    bus.emit('ping', 2);
    expect(received).toEqual([1]);
  });

  it('supports multiple listeners independently', () => {
    const bus = new TypedEventBus<{ ping: number }>();
    const a: number[] = [];
    const b: number[] = [];
    bus.on('ping', (n) => a.push(n));
    bus.on('ping', (n) => b.push(n * 2));
    bus.emit('ping', 3);
    expect(a).toEqual([3]);
    expect(b).toEqual([6]);
  });

  it('clear removes all listeners', () => {
    const bus = new TypedEventBus<{ ping: number }>();
    let count = 0;
    bus.on('ping', () => count++);
    bus.clear();
    bus.emit('ping', 1);
    expect(count).toBe(0);
  });
});
