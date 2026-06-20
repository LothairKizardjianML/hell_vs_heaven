// Authored asset manifest. Atlases and audio land here when real ones exist —
// adding their fields ahead of consumers would be speculation. The placeholder
// image is a 1×1 white PNG embedded as a data URI: every Sprite component that
// references it gets tinted + scaled by the RenderSystem to whatever the
// entity's Collider says, so one entry covers every placeholder rectangle in
// the game until real art arrives in Phase 10.

export interface ImageAsset {
  key: string;
  url: string;
}

export interface AssetManifest {
  images: ImageAsset[];
}

const PLACEHOLDER_WHITE_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP4DwQACfsD/Wj6HMwAAAAASUVORK5CYII=';

export const TEXTURE_KEYS = {
  Placeholder: 'placeholder',
} as const;

export type TextureKey = (typeof TEXTURE_KEYS)[keyof typeof TEXTURE_KEYS];

export const ASSETS: AssetManifest = {
  images: [{ key: TEXTURE_KEYS.Placeholder, url: PLACEHOLDER_WHITE_PX }],
};
