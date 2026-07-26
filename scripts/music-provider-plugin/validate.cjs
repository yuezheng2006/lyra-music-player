#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { validateProviderManifest } = require('./manifest.cjs');

// scripts/music-provider-plugin/validate.cjs
// CLI: npm run provider:validate -- path/to/plugin-dir

const pluginDir = process.argv[2];
if (!pluginDir) {
  console.error('Usage: npm run provider:validate -- <plugin-directory>');
  process.exit(2);
}

const resolvedDir = path.resolve(pluginDir);
const manifestPath = path.join(resolvedDir, 'provider.manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`Missing provider.manifest.json in ${resolvedDir}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const result = validateProviderManifest(raw, { source: 'user' });
if (!result.ok) {
  console.error('Manifest invalid:');
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

if (result.manifest.id !== path.basename(resolvedDir)) {
  console.error(
    `Folder name "${path.basename(resolvedDir)}" must equal manifest.id "${result.manifest.id}"`,
  );
  process.exit(1);
}

const adapterPath = path.resolve(resolvedDir, result.manifest.entry);
const relativeEntry = path.relative(resolvedDir, adapterPath);
if (!relativeEntry || relativeEntry.startsWith('..') || path.isAbsolute(relativeEntry)) {
  console.error('entry escapes plugin directory');
  process.exit(1);
}
if (!fs.existsSync(adapterPath)) {
  console.error(`Adapter missing: ${adapterPath}`);
  process.exit(1);
}

(async () => {
  const mod = await import(pathToFileURL(adapterPath).href);
  const adapter = mod.default || mod;
  for (const fn of ['search', 'audio']) {
    if (typeof adapter[fn] !== 'function') {
      console.error(`Adapter must export async function "${fn}"`);
      process.exit(1);
    }
  }
  if (result.manifest.capabilities.includes('lyrics') && typeof adapter.lyrics !== 'function') {
    console.error('Manifest lists lyrics capability but adapter.lyrics is missing');
    process.exit(1);
  }
  console.log(`OK: ${result.manifest.id}@${result.manifest.version}`);
  console.log(`  name: ${result.manifest.name}`);
  console.log(`  capabilities: ${result.manifest.capabilities.join(', ')}`);
  console.log(`  entry: ${result.manifest.entry}`);
})().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
