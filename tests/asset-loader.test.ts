import { describe, it, expect } from 'vitest';
import { preloadAssets, type AssetLoaderApi } from '../src/content/asset-loader';

function recordingLoader(): { calls: Array<[string, string]>; api: AssetLoaderApi } {
  const calls: Array<[string, string]> = [];
  const api: AssetLoaderApi = {
    image: (key, url) => calls.push([key, url]),
  };
  return { calls, api };
}

describe('preloadAssets', () => {
  it('dispatches each image entry to loader.image with its key + url', () => {
    const { api, calls } = recordingLoader();
    preloadAssets(api, {
      images: [
        { key: 'player', url: '/p.png' },
        { key: 'enemy', url: '/e.png' },
      ],
    });
    expect(calls).toEqual([
      ['player', '/p.png'],
      ['enemy', '/e.png'],
    ]);
  });

  it('makes no calls for an empty image list', () => {
    const { api, calls } = recordingLoader();
    preloadAssets(api, { images: [] });
    expect(calls).toEqual([]);
  });

  it('preserves the order entries appear in the manifest', () => {
    const { api, calls } = recordingLoader();
    preloadAssets(api, {
      images: [
        { key: 'c', url: '/c.png' },
        { key: 'a', url: '/a.png' },
        { key: 'b', url: '/b.png' },
      ],
    });
    expect(calls.map(([k]) => k)).toEqual(['c', 'a', 'b']);
  });
});
