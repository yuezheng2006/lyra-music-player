import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
    createEncryptedAuthSessionRepository,
    createQQAuthSessionRepository,
    decodeSessionEnvelope,
    encodeSessionEnvelope,
} = require('../../../electron/qqAuthSessionRepository.cjs') as {
    createEncryptedAuthSessionRepository: (deps?: Record<string, unknown>) => {
        clearCookie: () => { ok: boolean; error?: string };
        loadCookie: () => { ok: boolean; cookie?: string; error?: string };
        saveCookie: (cookie: string) => { ok: boolean; encrypted?: boolean; error?: string };
    };
    createQQAuthSessionRepository: (deps?: Record<string, unknown>) => {
        clearCookie: () => { ok: boolean; error?: string };
        loadCookie: () => { ok: boolean; cookie?: string; error?: string };
        saveCookie: (cookie: string) => { ok: boolean; encrypted?: boolean; error?: string };
    };
    decodeSessionEnvelope: (raw: string) => string | null;
    encodeSessionEnvelope: (encryptedBase64: string) => string;
};

// test/unit/electron/qqAuthSessionRepository.test.ts
// QQ Music cookie is encrypted at rest; plaintext is never written to the session file.

const createMemoryFs = () => {
    const files = new Map<string, string>();
    return {
        existsSync: (filePath: string) => files.has(filePath),
        readFileSync: (filePath: string) => {
            const value = files.get(filePath);
            if (value == null) throw new Error('enoent');
            return value;
        },
        writeFileSync: (filePath: string, value: string) => {
            files.set(filePath, value);
        },
        unlinkSync: (filePath: string) => {
            files.delete(filePath);
        },
        files,
    };
};

const createFakeSafeStorage = () => ({
    isEncryptionAvailable: () => true,
    encryptString: (value: string) => Buffer.from(`enc:${value}`, 'utf8'),
    decryptString: (buffer: Buffer) => buffer.toString('utf8').replace(/^enc:/, ''),
});

describe('qqAuthSessionRepository', () => {
    it('round-trips an encrypted session envelope', () => {
        const payload = encodeSessionEnvelope('abc123');
        expect(decodeSessionEnvelope(payload)).toBe('abc123');
        expect(decodeSessionEnvelope('{"version":1}')).toBeNull();
        expect(decodeSessionEnvelope('not-json')).toBeNull();
    });

    it('encrypts cookies to disk and never stores plaintext', () => {
        const fileSystem = createMemoryFs();
        const repository = createQQAuthSessionRepository({
            app: { getPath: () => '/tmp/lyra-user' },
            fs: fileSystem,
            path: { join: (...parts: string[]) => parts.join('/') },
            safeStorage: createFakeSafeStorage(),
        });

        expect(repository.saveCookie('uin=123; qm_keyst=secret')).toEqual({ ok: true, encrypted: true });
        const raw = [...fileSystem.files.values()][0];
        expect(raw).not.toContain('qm_keyst=secret');
        expect(repository.loadCookie()).toEqual({ ok: true, cookie: 'uin=123; qm_keyst=secret' });
    });

    it('refuses to write plaintext when encryption is unavailable', () => {
        const fileSystem = createMemoryFs();
        const repository = createQQAuthSessionRepository({
            app: { getPath: () => '/tmp/lyra-user' },
            fs: fileSystem,
            path: { join: (...parts: string[]) => parts.join('/') },
            safeStorage: { isEncryptionAvailable: () => false },
        });

        expect(repository.saveCookie('uin=123; qm_keyst=secret')).toEqual({
            ok: false,
            error: 'encryption-unavailable',
        });
        expect(fileSystem.files.size).toBe(0);
    });

    it('clears the encrypted session file', () => {
        const fileSystem = createMemoryFs();
        const repository = createQQAuthSessionRepository({
            app: { getPath: () => '/tmp/lyra-user' },
            fs: fileSystem,
            path: { join: (...parts: string[]) => parts.join('/') },
            safeStorage: createFakeSafeStorage(),
        });

        repository.saveCookie('uin=123; qm_keyst=secret');
        expect(repository.clearCookie()).toEqual({ ok: true });
        expect(repository.loadCookie()).toEqual({ ok: true, cookie: '' });
    });

    it('writes Qishui sessions to a separate encrypted file', () => {
        const fileSystem = createMemoryFs();
        const repository = createEncryptedAuthSessionRepository({
            app: { getPath: () => '/tmp/lyra-user' },
            fileName: 'qishui-auth-session.json',
            ipcChannel: 'qishui-save-auth-session',
            fs: fileSystem,
            path: { join: (...parts: string[]) => parts.join('/') },
            safeStorage: createFakeSafeStorage(),
        });

        expect(repository.saveCookie('sessionid=abcdefghij')).toEqual({ ok: true, encrypted: true });
        expect([...fileSystem.files.keys()]).toEqual(['/tmp/lyra-user/qishui-auth-session.json']);
        expect([...fileSystem.files.values()][0]).not.toContain('sessionid=abcdefghij');
        expect(repository.loadCookie()).toEqual({ ok: true, cookie: 'sessionid=abcdefghij' });
    });
});
