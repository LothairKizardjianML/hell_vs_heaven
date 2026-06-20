import { describe, it, expect } from 'vitest';
import { preloadAssets, type AssetLoaderApi } from '../src/content/asset-loader';

describe('preloadAssets', () => {
  it('dispatches each manifest entry to loader.image with its key + url', () => {
    const calls: Array<[string, string]> = [];
    const api: AssetLoaderApi = {
      image: (key, url) => calls.push([key, url]),
    };
    preloadAssets(api, [
      { key: 'player', url: '/p.png' },
      { key: 'enemy', url: '/e.png' },
    ]);
    expect(calls).toEqual([
      ['player', '/p.png'],
      ['enemy', '/e.png'],
    ]);
  });
});
