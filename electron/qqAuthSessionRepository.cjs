const fs = require('fs');
const path = require('path');

// electron/qqAuthSessionRepository.cjs
// Encrypts provider cookie headers with Electron safeStorage and writes them to userData.

const SESSION_FILE_NAME = 'qq-auth-session.json';
const SESSION_VERSION = 1;

const encodeSessionEnvelope = (encryptedBase64) => JSON.stringify({
    version: SESSION_VERSION,
    encrypted: true,
    payload: encryptedBase64,
});

const decodeSessionEnvelope = (raw) => {
    try {
        const parsed = JSON.parse(String(raw || ''));
        if (parsed?.version !== SESSION_VERSION || parsed.encrypted !== true) return null;
        if (typeof parsed.payload !== 'string' || !parsed.payload) return null;
        return parsed.payload;
    } catch {
        return null;
    }
};

/** Encrypted cookie file in userData. QQ and Qishui share this store shape. */
const createEncryptedAuthSessionRepository = (deps = {}) => {
    const fileSystem = deps.fs || fs;
    const pathApi = deps.path || path;
    const app = deps.app || (deps.electron || require('electron')).app;
    const safeStorage = deps.safeStorage || (deps.electron || require('electron')).safeStorage;
    const fileName = deps.fileName || SESSION_FILE_NAME;
    const ipcChannel = deps.ipcChannel || 'qq-music-save-auth-session';

    const resolveSessionPath = () => pathApi.join(app.getPath('userData'), fileName);

    const isEncryptionAvailable = () => {
        try {
            return Boolean(safeStorage?.isEncryptionAvailable?.());
        } catch {
            return false;
        }
    };

    const clearCookie = () => {
        const sessionPath = resolveSessionPath();
        try {
            if (fileSystem.existsSync(sessionPath)) {
                fileSystem.unlinkSync(sessionPath);
            }
            return { ok: true };
        } catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : 'clear-failed' };
        }
    };

    const saveCookie = (cookie) => {
        const normalized = String(cookie || '').trim();
        if (!normalized) {
            return clearCookie();
        }
        if (!isEncryptionAvailable()) {
            return { ok: false, error: 'encryption-unavailable' };
        }
        try {
            const encryptedBase64 = safeStorage.encryptString(normalized).toString('base64');
            fileSystem.writeFileSync(resolveSessionPath(), encodeSessionEnvelope(encryptedBase64), 'utf8');
            return { ok: true, encrypted: true };
        } catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : 'save-failed' };
        }
    };

    const loadCookie = () => {
        const sessionPath = resolveSessionPath();
        if (!fileSystem.existsSync(sessionPath)) {
            return { ok: true, cookie: '' };
        }
        if (!isEncryptionAvailable()) {
            return { ok: false, error: 'encryption-unavailable', cookie: '' };
        }
        try {
            const payload = decodeSessionEnvelope(fileSystem.readFileSync(sessionPath, 'utf8'));
            if (!payload) {
                return { ok: false, error: 'invalid-session', cookie: '' };
            }
            const cookie = safeStorage.decryptString(Buffer.from(payload, 'base64')).trim();
            return { ok: true, cookie };
        } catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : 'load-failed', cookie: '' };
        }
    };

    const registerIpcHandlers = (ipcMain) => {
        ipcMain.handle(ipcChannel, (_event, cookie) => saveCookie(cookie));
    };

    return {
        clearCookie,
        isEncryptionAvailable,
        loadCookie,
        registerIpcHandlers,
        saveCookie,
    };
};

const createQQAuthSessionRepository = (deps = {}) => createEncryptedAuthSessionRepository({
    ...deps,
    fileName: SESSION_FILE_NAME,
    ipcChannel: 'qq-music-save-auth-session',
});

module.exports = {
    SESSION_FILE_NAME,
    createEncryptedAuthSessionRepository,
    createQQAuthSessionRepository,
    decodeSessionEnvelope,
    encodeSessionEnvelope,
};
