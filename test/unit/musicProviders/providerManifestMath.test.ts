import { describe, expect, it } from 'vitest';
import {
  mergeProviderCatalogIds,
  resolveProviderDisplayLabel,
  validateProviderManifest,
} from '@/utils/musicProviders/providerManifestMath';

// test/unit/musicProviders/providerManifestMath.test.ts

describe('validateProviderManifest', () => {
  it('accepts a valid open-mode manifest', () => {
    const result = validateProviderManifest({
      id: 'demo-echo',
      name: 'Demo Echo',
      version: '1.0.0',
      protocolVersion: 1,
      capabilities: ['search', 'audio', 'lyrics'],
      auth: 'none',
      entry: 'adapter.mjs',
      ui: { label: 'Demo Echo' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.id).toBe('demo-echo');
      expect(result.manifest.capabilities).toContain('lyrics');
    }
  });

  it('rejects reserved first-class and curated ids for user plugins', () => {
    expect(validateProviderManifest({
      id: 'netease',
      name: 'X',
      version: '1',
      protocolVersion: 1,
      capabilities: ['search', 'audio'],
    }, { source: 'user' }).ok).toBe(false);

    expect(validateProviderManifest({
      id: 'qq',
      name: 'X',
      version: '1',
      protocolVersion: 1,
      capabilities: ['search', 'audio'],
    }, { source: 'user' }).ok).toBe(false);

    expect(validateProviderManifest({
      id: 'playlist',
      name: 'X',
      version: '1',
      protocolVersion: 1,
      capabilities: ['search', 'audio'],
    }, { source: 'user' }).ok).toBe(false);
  });

  it('allows curated ids for builtin manifests', () => {
    const result = validateProviderManifest({
      id: 'qq',
      name: 'QQ',
      version: '1.0.0',
      protocolVersion: 1,
      capabilities: ['search', 'audio'],
    }, { source: 'builtin' });
    expect(result.ok).toBe(true);
  });

  it('requires search+audio and relative entry', () => {
    const missingCaps = validateProviderManifest({
      id: 'demo-echo',
      name: 'Demo',
      version: '1',
      protocolVersion: 1,
      capabilities: ['search'],
    });
    expect(missingCaps.ok).toBe(false);

    const badEntry = validateProviderManifest({
      id: 'demo-echo',
      name: 'Demo',
      version: '1',
      protocolVersion: 1,
      capabilities: ['search', 'audio'],
      entry: '../escape.mjs',
    });
    expect(badEntry.ok).toBe(false);
  });
});

describe('mergeProviderCatalogIds', () => {
  it('keeps built-in seed order and appends user plugins', () => {
    const ids = mergeProviderCatalogIds([
      { id: 'qq', name: 'QQ', version: 'legacy', protocolVersion: 1, capabilities: ['search', 'audio'], auth: 'none', source: 'builtin' },
      { id: 'demo-echo', name: 'Demo', version: '1', protocolVersion: 1, capabilities: ['search', 'audio'], auth: 'none', source: 'user' },
    ]);
    expect(ids[0]).toBe('netease');
    expect(ids).toContain('qq');
    expect(ids[ids.length - 1]).toBe('demo-echo');
  });
});

describe('resolveProviderDisplayLabel', () => {
  it('prefers built-in labels then manifest ui label', () => {
    expect(resolveProviderDisplayLabel('coco', [], { coco: 'Coco Free' })).toBe('Coco Free');
    expect(resolveProviderDisplayLabel('demo-echo', [{
      id: 'demo-echo',
      name: 'Demo Echo',
      version: '1',
      protocolVersion: 1,
      capabilities: ['search', 'audio'],
      auth: 'none',
      source: 'user',
      ui: { label: 'Echo' },
    }], {})).toBe('Echo');
  });
});
