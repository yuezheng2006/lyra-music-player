// scripts/music-provider-plugin/manifest.cjs
// Pure-ish validators for music provider plugin manifests (protocol v1).

const PROVIDER_ID_RE = /^[a-z][a-z0-9-]{1,31}$/;

/** First-class channels that plugins must never claim. */
const FIRST_CLASS_RESERVED_IDS = new Set([
  'netease',
  'navidrome',
  'ytm',
  'ytmusic',
  'local',
  'stage',
]);

/** Official curated sidecar sources shipped in-repo. */
const CURATED_BUILTIN_IDS = new Set([
  'qq',
  'qishui',
  'coco',
  'kugou',
  'bilibili',
  'kuwo',
]);

const VALID_CAPABILITIES = new Set(['search', 'audio', 'lyrics', 'recommend']);
const VALID_AUTH = new Set(['none', 'cookie-header']);

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const pathIsAbsolute = (value) =>
  value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value);

/**
 * Validate a provider.manifest.json payload.
 * @param {unknown} raw
 * @param {{ source?: 'builtin' | 'user' | 'env' }} [options]
 * @returns {{ ok: true, manifest: object } | { ok: false, errors: string[] }}
 */
const validateProviderManifest = (raw, options = {}) => {
  const source = options.source || 'user';
  const errors = [];
  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['manifest must be a JSON object'] };
  }

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!PROVIDER_ID_RE.test(id)) {
    errors.push('id must match /^[a-z][a-z0-9-]{1,31}$/');
  } else if (FIRST_CLASS_RESERVED_IDS.has(id)) {
    errors.push(`id "${id}" is reserved for a first-class channel`);
  } else if (source === 'user' && CURATED_BUILTIN_IDS.has(id)) {
    errors.push(`id "${id}" is reserved for a built-in curated provider`);
  }

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) {
    errors.push('name is required');
  }

  const version = typeof raw.version === 'string' ? raw.version.trim() : '';
  if (!version) {
    errors.push('version is required');
  }

  const protocolVersion = Number(raw.protocolVersion);
  if (protocolVersion !== 1) {
    errors.push('protocolVersion must be 1');
  }

  const capabilities = Array.isArray(raw.capabilities) ? raw.capabilities : null;
  if (!capabilities || capabilities.length === 0) {
    errors.push('capabilities must be a non-empty array');
  } else {
    for (const cap of capabilities) {
      if (!VALID_CAPABILITIES.has(cap)) {
        errors.push(`unknown capability: ${String(cap)}`);
      }
    }
    if (!capabilities.includes('search') || !capabilities.includes('audio')) {
      errors.push('capabilities must include "search" and "audio"');
    }
  }

  const auth = raw.auth == null ? 'none' : raw.auth;
  if (!VALID_AUTH.has(auth)) {
    errors.push('auth must be "none" or "cookie-header"');
  }

  const entry = raw.entry == null
    ? 'adapter.mjs'
    : (typeof raw.entry === 'string' ? raw.entry.trim() : '');
  if (!entry || entry.includes('..') || pathIsAbsolute(entry)) {
    errors.push('entry must be a relative file path without ".."');
  }

  let ui = undefined;
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
      capabilities: [...new Set(capabilities)],
      auth,
      entry,
      ...(ui && Object.keys(ui).length > 0 ? { ui } : {}),
    },
  };
};

module.exports = {
  PROVIDER_ID_RE,
  FIRST_CLASS_RESERVED_IDS,
  CURATED_BUILTIN_IDS,
  VALID_CAPABILITIES,
  validateProviderManifest,
};
