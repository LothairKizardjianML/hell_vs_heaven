// Pure dispatcher that walks an AssetManifest and calls the loader API once
// per entry. Phaser-free so it stays headless-testable; the Phaser scene's
// `this.load` plugin satisfies AssetLoaderApi at runtime.

import type { AssetManifest } from './assets';

export interface AssetLoaderApi {
  image(key: string, url: string): void;
}

export function preloadAssets(loader: AssetLoaderApi, manifest: AssetManifest): void {
  for (const entry of manifest.images) {
    loader.image(entry.key, entry.url);
  }
}
