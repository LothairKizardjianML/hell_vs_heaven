// Authored asset manifest. The placeholder image is a 1×1 white PNG embedded as
// a data URI: every Sprite component that references it gets tinted + scaled by
// the RenderSystem to whatever the entity's Collider says, so one entry covers
// every placeholder rectangle in the game until real art arrives in Phase 10.
// AssetManifest is a plain ImageAsset[] for now — when a second asset kind
// arrives, swap to a discriminated union; no wrapper needed in the meantime.

export interface ImageAsset {
  key: string;
  url: string;
}

export type AssetManifest = ImageAsset[];

const PLACEHOLDER_WHITE_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP4DwQACfsD/Wj6HMwAAAAASUVORK5CYII=';

export const TEXTURE_KEYS = {
  Placeholder: 'placeholder',
} as const;

export const ASSETS: AssetManifest = [
  { key: TEXTURE_KEYS.Placeholder, url: PLACEHOLDER_WHITE_PX },
];
