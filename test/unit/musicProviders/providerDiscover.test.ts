import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';

// test/unit/musicProviders/providerDiscover.test.ts

const require = createRequire(import.meta.url);
const { createProviderRegistry } = require('../../../scripts/music-provider-plugin/discover.cjs') as {
  createProviderRegistry: (options: {
    builtinAdaptersDir: string;
    userPluginsDir?: string | null;
  }) => {
    listProviders: () => Array<{ id: string; source: string }>;
    hasProvider: (id: string) => boolean;
    rescan: () => Array<{ id: string; source: string }>;
  };
};

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('createProviderRegistry', () => {
  it('registers legacy built-in adapters and dynamic user plugins', () => {
    const builtinDir = path.resolve(process.cwd(), 'scripts/music-provider-adapters');
    const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lyra-providers-'));
    tempDirs.push(userDir);

    const pluginDir = path.join(userDir, 'demo-echo');
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(path.join(pluginDir, 'provider.manifest.json'), JSON.stringify({
      id: 'demo-echo',
      name: 'Demo Echo',
      version: '1.0.0',
      protocolVersion: 1,
      capabilities: ['search', 'audio'],
      auth: 'none',
      entry: 'adapter.mjs',
    }));
    fs.writeFileSync(path.join(pluginDir, 'adapter.mjs'), 'export async function search(){return {songs:[]}}\nexport async function audio(){return {audioUrl:null}}\n');

    const registry = createProviderRegistry({
      builtinAdaptersDir: builtinDir,
      userPluginsDir: userDir,
    });

    expect(registry.hasProvider('qq')).toBe(true);
    expect(registry.hasProvider('qishui')).toBe(true);
    expect(registry.hasProvider('demo-echo')).toBe(true);
    expect(registry.hasProvider('example')).toBe(false);

    const demo = registry.listProviders().find((entry) => entry.id === 'demo-echo');
    expect(demo?.source).toBe('user');
  });

  it('rejects user plugins that claim curated ids', () => {
    const builtinDir = path.resolve(process.cwd(), 'scripts/music-provider-adapters');
    const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lyra-providers-'));
    tempDirs.push(userDir);

    const pluginDir = path.join(userDir, 'qq');
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(path.join(pluginDir, 'provider.manifest.json'), JSON.stringify({
      id: 'qq',
      name: 'Fake QQ',
      version: '1.0.0',
      protocolVersion: 1,
      capabilities: ['search', 'audio'],
      entry: 'adapter.mjs',
    }));
    fs.writeFileSync(path.join(pluginDir, 'adapter.mjs'), 'export async function search(){return {songs:[]}}\nexport async function audio(){return {audioUrl:null}}\n');

    const registry = createProviderRegistry({
      builtinAdaptersDir: builtinDir,
      userPluginsDir: userDir,
    });

    const qq = registry.listProviders().find((entry) => entry.id === 'qq');
    expect(qq?.source).toBe('builtin');
  });
});
