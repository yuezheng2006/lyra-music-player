const fs = require('fs');
const path = require('path');
const {
  CURATED_BUILTIN_IDS,
  validateProviderManifest,
} = require('./manifest.cjs');

// scripts/music-provider-plugin/discover.cjs
// Discovers built-in + user music provider plugins (protocol v1).

const LEGACY_FLAT_ADAPTERS = {
  qq: 'qq-provider-adapter.mjs',
  coco: 'coco-provider-adapter.mjs',
  qishui: 'qishui-provider-adapter.mjs',
  kugou: 'kugou-provider-adapter.mjs',
  bilibili: 'bilibili-provider-adapter.mjs',
  kuwo: 'kuwo-provider-adapter.mjs',
};

const LEGACY_LABELS = {
  qq: 'QQ Music',
  qishui: 'Qishui',
  coco: 'Coco',
  kugou: 'Kugou',
  bilibili: 'Bilibili',
  kuwo: 'Kuwo',
};

const SKIP_DIR_NAMES = new Set(['example', 'node_modules', '.git']);

const providerAdapterEnvName = (provider) =>
  `MUSIC_PROVIDER_${String(provider).toUpperCase().replace(/-/g, '_')}_ADAPTER`;

const ensureDir = (dirPath) => {
  if (!dirPath) return;
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // Ignore mkdir races / permission errors; discovery still proceeds.
  }
};

const readManifestFile = (manifestPath, source) => {
  try {
    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const result = validateProviderManifest(raw, { source });
    if (!result.ok) {
      console.warn(
        `[music-provider-sidecar] invalid manifest ${manifestPath}: ${result.errors.join('; ')}`,
      );
      return null;
    }
    return result.manifest;
  } catch (error) {
    console.warn(
      `[music-provider-sidecar] failed to read manifest ${manifestPath}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
};

const toPublicSummary = (registration) => ({
  id: registration.id,
  name: registration.name,
  version: registration.version,
  protocolVersion: registration.protocolVersion,
  capabilities: registration.capabilities,
  auth: registration.auth,
  source: registration.source,
  ui: registration.ui || undefined,
});

/**
 * @param {{
 *   builtinAdaptersDir: string,
 *   userPluginsDir?: string | null,
 * }} options
 */
const createProviderRegistry = (options) => {
  const builtinAdaptersDir = options.builtinAdaptersDir;
  const userPluginsDir = options.userPluginsDir || null;
  /** @type {Map<string, object>} */
  const byId = new Map();

  const register = (registration, { overwrite = false } = {}) => {
    if (!registration?.id) return false;
    if (byId.has(registration.id) && !overwrite) {
      return false;
    }
    byId.set(registration.id, registration);
    return true;
  };

  const registerLegacyFlatAdapters = () => {
    for (const [id, fileName] of Object.entries(LEGACY_FLAT_ADAPTERS)) {
      const adapterPath = path.join(builtinAdaptersDir, fileName);
      if (!fs.existsSync(adapterPath)) {
        console.warn(`[music-provider-sidecar] missing legacy adapter for ${id}: ${adapterPath}`);
        continue;
      }
      register({
        id,
        name: LEGACY_LABELS[id] || id,
        version: 'legacy',
        protocolVersion: 1,
        capabilities: id === 'qq' || id === 'qishui' || id === 'bilibili'
          ? ['search', 'audio', 'lyrics']
          : ['search', 'audio'],
        auth: id === 'qq' || id === 'qishui' ? 'cookie-header' : 'none',
        source: 'builtin',
        adapterPath,
        ui: { label: LEGACY_LABELS[id] || id },
      });
    }
  };

  const scanManifestDirectory = (rootDir, source) => {
    if (!rootDir || !fs.existsSync(rootDir)) {
      return;
    }
    let entries = [];
    try {
      entries = fs.readdirSync(rootDir, { withFileTypes: true });
    } catch (error) {
      console.warn(
        `[music-provider-sidecar] cannot read plugins dir ${rootDir}:`,
        error instanceof Error ? error.message : error,
      );
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIR_NAMES.has(entry.name)) {
        continue;
      }
      const pluginDir = path.join(rootDir, entry.name);
      const manifestPath = path.join(pluginDir, 'provider.manifest.json');
      if (!fs.existsSync(manifestPath)) {
        continue;
      }
      const manifest = readManifestFile(manifestPath, source);
      if (!manifest) {
        continue;
      }
      if (manifest.id !== entry.name) {
        console.warn(
          `[music-provider-sidecar] skip ${pluginDir}: folder name "${entry.name}" != manifest.id "${manifest.id}"`,
        );
        continue;
      }
      const pluginRoot = path.resolve(pluginDir);
      const adapterPath = path.resolve(pluginDir, manifest.entry);
      const relativeEntry = path.relative(pluginRoot, adapterPath);
      if (
        !relativeEntry
        || relativeEntry.startsWith('..')
        || path.isAbsolute(relativeEntry)
      ) {
        console.warn(`[music-provider-sidecar] skip ${pluginDir}: entry escapes plugin directory`);
        continue;
      }
      if (!fs.existsSync(adapterPath)) {
        console.warn(`[music-provider-sidecar] skip ${pluginDir}: adapter missing at ${adapterPath}`);
        continue;
      }
      // User plugins cannot overwrite built-ins; built-in dir manifests can refine legacy.
      register({
        ...manifest,
        source,
        adapterPath,
      }, { overwrite: source === 'builtin' });
    }
  };

  const applyEnvOverrides = () => {
    for (const id of byId.keys()) {
      const envPath = process.env[providerAdapterEnvName(id)];
      if (envPath && envPath.trim()) {
        const resolved = path.isAbsolute(envPath.trim())
          ? envPath.trim()
          : path.resolve(process.cwd(), envPath.trim());
        if (fs.existsSync(resolved)) {
          const current = byId.get(id);
          byId.set(id, { ...current, adapterPath: resolved, source: 'env' });
        }
      }
    }

    // Allow env to introduce a brand-new provider via MUSIC_PROVIDER_{ID}_ADAPTER + optional manifest beside it.
    for (const [key, value] of Object.entries(process.env)) {
      const match = key.match(/^MUSIC_PROVIDER_([A-Z0-9_]+)_ADAPTER$/);
      if (!match || !value?.trim()) continue;
      const id = match[1].toLowerCase().replace(/_/g, '-');
      if (byId.has(id)) continue;
      const resolved = path.isAbsolute(value.trim())
        ? value.trim()
        : path.resolve(process.cwd(), value.trim());
      if (!fs.existsSync(resolved)) continue;
      const siblingManifest = path.join(path.dirname(resolved), 'provider.manifest.json');
      let manifest = null;
      if (fs.existsSync(siblingManifest)) {
        manifest = readManifestFile(siblingManifest, 'env');
      }
      register({
        id: manifest?.id || id,
        name: manifest?.name || id,
        version: manifest?.version || 'env',
        protocolVersion: 1,
        capabilities: manifest?.capabilities || ['search', 'audio'],
        auth: manifest?.auth || 'none',
        source: 'env',
        adapterPath: resolved,
        ui: manifest?.ui,
      });
    }
  };

  const rescan = () => {
    byId.clear();
    ensureDir(userPluginsDir);
    registerLegacyFlatAdapters();
    scanManifestDirectory(builtinAdaptersDir, 'builtin');
    scanManifestDirectory(userPluginsDir, 'user');
    applyEnvOverrides();
    return listProviders();
  };

  const listProviders = () =>
    [...byId.values()]
      .map(toPublicSummary)
      .sort((a, b) => a.id.localeCompare(b.id));

  const getRegistration = (id) => byId.get(id) || null;

  const hasProvider = (id) => byId.has(id);

  const getAdapterPath = (id) => byId.get(id)?.adapterPath || null;

  const getUserPluginsDir = () => userPluginsDir;

  const isCuratedBuiltin = (id) => CURATED_BUILTIN_IDS.has(id);

  rescan();

  return {
    rescan,
    listProviders,
    getRegistration,
    hasProvider,
    getAdapterPath,
    getUserPluginsDir,
    isCuratedBuiltin,
  };
};

module.exports = {
  LEGACY_FLAT_ADAPTERS,
  createProviderRegistry,
};
