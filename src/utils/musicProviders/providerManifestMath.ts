// src/utils/musicProviders/providerManifestMath.ts
// Protocol v1 manifest validation mirrored for unit tests and renderer-side checks.

export const PROVIDER_ID_RE = /^[a-z][a-z0-9-]{1,31}$/;

export const FIRST_CLASS_RESERVED_IDS = [
  'netease',
  'navidrome',
  'ytm',
  'ytmusic',
  'local',
  'stage',
  // HomeViewTab surfaces — must not be claimable as open-mode plugin ids.
  'playlist',
  'albums',
  'radio',
  'daily',
  'podcast',
  'history',
] as const;

export const CURATED_BUILTIN_IDS = [
  'qq',
  'qishui',
  'coco',
  'kugou',
  'bilibili',
  'kuwo',
] as const;

export const BUILTIN_ONLINE_PROVIDER_IDS = [
  'netease',
  'qq',
  'qishui',
  'coco',
  'kugou',
  'bilibili',
  'kuwo',
] as const;

export type BuiltInOnlineMusicProviderId = (typeof BUILTIN_ONLINE_PROVIDER_IDS)[number];

export type ProviderManifestCapability = 'search' | 'audio' | 'lyrics' | 'recommend';
export type ProviderManifestAuth = 'none' | 'cookie-header';

export type ProviderManifest = {
  id: string;
  name: string;
  version: string;
  protocolVersion: 1;
  capabilities: ProviderManifestCapability[];
  auth: ProviderManifestAuth;
  entry: string;
  ui?: {
    label?: string;
    labelKey?: string;
    accent?: string;
  };
};

export type ProviderCatalogEntry = {
  id: string;
  name: string;
  version: string;
  protocolVersion: number;
  capabilities: string[];
  auth: string;
  source: 'builtin' | 'user' | 'env' | string;
  ui?: {
    label?: string;
    labelKey?: string;
    accent?: string;
  };
};

const VALID_CAPABILITIES = new Set<string>(['search', 'audio', 'lyrics', 'recommend']);
const VALID_AUTH = new Set<string>(['none', 'cookie-header']);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const pathIsAbsolute = (value: string) =>
  value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value);

/** Validate provider.manifest.json for open-mode / user plugins. */
export const validateProviderManifest = (
  raw: unknown,
  options: { source?: 'builtin' | 'user' | 'env' } = {},
): { ok: true; manifest: ProviderManifest } | { ok: false; errors: string[] } => {
  const source = options.source ?? 'user';
  const errors: string[] = [];
  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['manifest must be a JSON object'] };
  }

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!PROVIDER_ID_RE.test(id)) {
    errors.push('id must match /^[a-z][a-z0-9-]{1,31}$/');
  } else if ((FIRST_CLASS_RESERVED_IDS as readonly string[]).includes(id)) {
    errors.push(`id "${id}" is reserved for a first-class channel`);
  } else if (source === 'user' && (CURATED_BUILTIN_IDS as readonly string[]).includes(id)) {
    errors.push(`id "${id}" is reserved for a built-in curated provider`);
  }

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) errors.push('name is required');

  const version = typeof raw.version === 'string' ? raw.version.trim() : '';
  if (!version) errors.push('version is required');

  if (Number(raw.protocolVersion) !== 1) {
    errors.push('protocolVersion must be 1');
  }

  const capabilities = Array.isArray(raw.capabilities) ? raw.capabilities : null;
  if (!capabilities || capabilities.length === 0) {
    errors.push('capabilities must be a non-empty array');
  } else {
    for (const cap of capabilities) {
      if (!VALID_CAPABILITIES.has(String(cap))) {
        errors.push(`unknown capability: ${String(cap)}`);
      }
    }
    if (!capabilities.includes('search') || !capabilities.includes('audio')) {
      errors.push('capabilities must include "search" and "audio"');
    }
  }

  const auth = raw.auth == null ? 'none' : raw.auth;
  if (!VALID_AUTH.has(String(auth))) {
    errors.push('auth must be "none" or "cookie-header"');
  }

  const entry = raw.entry == null
    ? 'adapter.mjs'
    : (typeof raw.entry === 'string' ? raw.entry.trim() : '');
  if (!entry || entry.includes('..') || pathIsAbsolute(entry)) {
    errors.push('entry must be a relative file path without ".."');
  }

  let ui: ProviderManifest['ui'];
  if (raw.ui != null) {
    if (!isPlainObject(raw.ui)) {
      errors.push('ui must be an object when present');
    } else {
      ui = {
        ...(typeof raw.ui.label === 'string' ? { label: raw.ui.label.trim() } : {}),
        ...(typeof raw.ui.labelKey === 'string' ? { labelKey: raw.ui.labelKey.trim() } : {}),
        ...(typeof raw.ui.accent === 'string' ? { accent: raw.ui.accent.trim() } : {}),
      };
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    manifest: {
      id,
      name,
      version,
      protocolVersion: 1,
      capabilities: [...new Set(capabilities as ProviderManifestCapability[])],
      auth: auth as ProviderManifestAuth,
      entry,
      ...(ui && Object.keys(ui).length > 0 ? { ui } : {}),
    },
  };
};

export const isBuiltInOnlineMusicProviderId = (
  id?: string | null,
): id is BuiltInOnlineMusicProviderId =>
  Boolean(id && (BUILTIN_ONLINE_PROVIDER_IDS as readonly string[]).includes(id));

/** Merge built-in seed ids with sidecar catalog plugin ids (stable order). */
export const mergeProviderCatalogIds = (
  catalog: readonly ProviderCatalogEntry[],
  seedIds: readonly string[] = BUILTIN_ONLINE_PROVIDER_IDS,
): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of seedIds) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const entry of catalog) {
    if (!entry?.id || seen.has(entry.id)) continue;
    // Skip first-class channels if a plugin ever mis-advertises them.
    if ((FIRST_CLASS_RESERVED_IDS as readonly string[]).includes(entry.id)) continue;
    if (entry.id === 'netease') continue;
    seen.add(entry.id);
    out.push(entry.id);
  }
  return out;
};

export const resolveProviderDisplayLabel = (
  providerId: string,
  catalog: readonly ProviderCatalogEntry[],
  builtInLabels: Partial<Record<string, string>>,
): string => {
  if (builtInLabels[providerId]) return builtInLabels[providerId] as string;
  const entry = catalog.find((item) => item.id === providerId);
  return entry?.ui?.label || entry?.name || providerId;
};
