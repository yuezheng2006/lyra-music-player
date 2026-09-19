const {
    buildQishuiCookieHeader,
    qishuiCookieHasLogin,
    resolveQishuiLoginPopupAction,
} = require('./qishuiAuthCookies.cjs');

// electron/qishuiAuthLogin.cjs
// Isolated partition: official Douyin Qishui web login → encrypted cookie for the sidecar.

const QISHUI_LOGIN_PARTITION = 'persist:lyra-qishui-login';
const QISHUI_LOGIN_URL = 'https://music.douyin.com/qishui/';
const QISHUI_LOGIN_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const CLICK_LOGIN_SCRIPT = `
        setTimeout(() => {
          const nodes = Array.from(document.querySelectorAll('a, button, span, div'));
          const loginNode = nodes.find((node) => {
            const text = (node.textContent || '').trim();
            if (!/^(登录|登陆|手机扫码登录|扫码登录)$/.test(text)) return false;
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          if (loginNode) loginNode.click();
        }, 700);
      `;

const createQishuiAuthLogin = (deps = {}) => {
    const electron = deps.electron || require('electron');
    const BrowserWindow = deps.BrowserWindow || electron.BrowserWindow;
    const session = deps.session || electron.session;
    const shell = deps.shell || electron.shell;
    const repository = deps.repository;
    const getAppIconPath = deps.getAppIconPath || (() => undefined);

    const readCookieHeader = async (cookieSession) => {
        const cookies = await cookieSession.cookies.get({});
        return buildQishuiCookieHeader(cookies);
    };

    const persistCookie = (cookie) => {
        if (!cookie || !qishuiCookieHasLogin(cookie) || !repository) return;
        repository.saveCookie(cookie);
    };

    const applyChromeUserAgent = (cookieSession) => {
        if (typeof cookieSession?.setUserAgent === 'function') {
            cookieSession.setUserAgent(QISHUI_LOGIN_USER_AGENT);
        }
    };

    const openLoginWindow = async (owner) => {
        const cookieSession = session.fromPartition(QISHUI_LOGIN_PARTITION);
        applyChromeUserAgent(cookieSession);
        const initialCookie = await readCookieHeader(cookieSession);
        if (qishuiCookieHasLogin(initialCookie)) {
            persistCookie(initialCookie);
            return { ok: true, cookie: initialCookie, reused: true };
        }

        return new Promise((resolve) => {
            let settled = false;
            let pollTimer = null;

            const loginWindow = new BrowserWindow({
                width: 460,
                height: 640,
                minWidth: 380,
                minHeight: 520,
                show: false,
                autoHideMenuBar: true,
                title: '汽水音乐登录',
                backgroundColor: '#111111',
                icon: getAppIconPath(),
                parent: owner && !owner.isDestroyed() ? owner : undefined,
                modal: false,
                webPreferences: {
                    partition: QISHUI_LOGIN_PARTITION,
                    contextIsolation: true,
                    nodeIntegration: false,
                    sandbox: true,
                },
            });

            const finish = (result) => {
                if (settled) return;
                settled = true;
                if (pollTimer) clearInterval(pollTimer);
                if (result?.ok && result.cookie) persistCookie(result.cookie);
                if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
                resolve(result);
            };

            const checkCookies = async () => {
                try {
                    const cookie = await readCookieHeader(cookieSession);
                    if (qishuiCookieHasLogin(cookie)) {
                        finish({ ok: true, cookie });
                    }
                } catch (error) {
                    console.warn('Qishui login cookie check failed:', error.message);
                }
            };

            const attachPopupPolicy = (contents) => {
                if (!contents || contents.isDestroyed?.()) return;
                contents.setUserAgent(QISHUI_LOGIN_USER_AGENT);
                contents.setWindowOpenHandler(({ url }) => {
                    const action = resolveQishuiLoginPopupAction(url);
                    if (action === 'allow') {
                        return {
                            action: 'allow',
                            overrideBrowserWindowOptions: {
                                width: 420,
                                height: 640,
                                autoHideMenuBar: true,
                                parent: loginWindow,
                                webPreferences: {
                                    partition: QISHUI_LOGIN_PARTITION,
                                    contextIsolation: true,
                                    nodeIntegration: false,
                                    sandbox: true,
                                },
                            },
                        };
                    }
                    if (url) shell.openExternal(url).catch(() => {});
                    return { action: 'deny' };
                });
            };

            attachPopupPolicy(loginWindow.webContents);
            loginWindow.webContents.on('did-create-window', (child) => {
                attachPopupPolicy(child.webContents);
            });

            loginWindow.webContents.on('did-finish-load', () => {
                void checkCookies();
                loginWindow.webContents.executeJavaScript(CLICK_LOGIN_SCRIPT, true).catch(() => {});
            });

            loginWindow.on('ready-to-show', () => {
                if (owner && !owner.isDestroyed()) {
                    const parentBounds = owner.getBounds();
                    const windowBounds = loginWindow.getBounds();
                    loginWindow.setPosition(
                        Math.round(parentBounds.x + (parentBounds.width - windowBounds.width) / 2),
                        Math.round(parentBounds.y + (parentBounds.height - windowBounds.height) / 2),
                    );
                }
                loginWindow.show();
            });

            loginWindow.on('closed', async () => {
                if (settled) return;
                if (pollTimer) clearInterval(pollTimer);
                try {
                    const cookie = await readCookieHeader(cookieSession);
                    finish(qishuiCookieHasLogin(cookie)
                        ? { ok: true, cookie }
                        : { ok: false, cancelled: true, message: '汽水登录窗口已关闭' });
                } catch (error) {
                    finish({ ok: false, error: error.message || '汽水登录窗口已关闭' });
                }
            });

            pollTimer = setInterval(checkCookies, 1200);
            loginWindow.loadURL(QISHUI_LOGIN_URL).catch((error) => finish({ ok: false, error: error.message }));
        });
    };

    const readStoredOrPartitionCookie = async () => {
        const cookieSession = session.fromPartition(QISHUI_LOGIN_PARTITION);
        const partitionCookie = await readCookieHeader(cookieSession);
        if (qishuiCookieHasLogin(partitionCookie)) {
            persistCookie(partitionCookie);
            return { ok: true, cookie: partitionCookie };
        }
        const loaded = repository?.loadCookie?.() || { ok: false, cookie: '' };
        if (loaded.ok && loaded.cookie && qishuiCookieHasLogin(loaded.cookie)) {
            return { ok: true, cookie: loaded.cookie };
        }
        return { ok: false };
    };

    const clearLoginSession = async () => {
        repository?.clearCookie?.();
        const cookieSession = session.fromPartition(QISHUI_LOGIN_PARTITION);
        await cookieSession.clearStorageData({
            storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage'],
        });
        return { ok: true };
    };

    const registerIpcHandlers = (ipcMain, options = {}) => {
        const getSenderWindow = options.getSenderWindow || (() => null);
        ipcMain.handle('qishui-open-login', (event) => openLoginWindow(getSenderWindow(event)));
        ipcMain.handle('qishui-get-login-cookie', () => readStoredOrPartitionCookie());
        ipcMain.handle('qishui-clear-login', () => clearLoginSession());
    };

    return {
        clearLoginSession,
        openLoginWindow,
        readStoredOrPartitionCookie,
        registerIpcHandlers,
    };
};

module.exports = {
    QISHUI_LOGIN_PARTITION,
    QISHUI_LOGIN_URL,
    createQishuiAuthLogin,
};
