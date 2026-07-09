const { BrowserWindow, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// electron/desktopLyrics.cjs
// Owns the transparent always-on-top desktop lyrics overlay window.

const DESKTOP_LYRICS_IPC = {
  setEnabled: 'folia-desktop-lyrics-set-enabled',
  update: 'folia-desktop-lyrics-update',
  setDragging: 'folia-desktop-lyrics-set-dragging',
  setPointerCapture: 'folia-desktop-lyrics-set-pointer-capture',
  setHotBounds: 'folia-desktop-lyrics-set-hot-bounds',
  setLockState: 'folia-desktop-lyrics-set-lock-state',
  moveBy: 'folia-desktop-lyrics-move-by',
  getStatus: 'folia-desktop-lyrics-get-status',
  stateEvent: 'folia-desktop-lyrics-state',
  lockStateEvent: 'folia-desktop-lyrics-lock-state',
  enabledStateEvent: 'folia-desktop-lyrics-enabled-state',
};

const DESKTOP_LYRICS_SETTING_KEYS = {
  enabled: 'DESKTOP_LYRICS_ENABLED',
  userBounds: 'DESKTOP_LYRICS_USER_BOUNDS',
  y: 'DESKTOP_LYRICS_Y',
  opacity: 'DESKTOP_LYRICS_OPACITY',
};

const DESKTOP_LYRICS_WINDOW_TITLE = 'Lyra Desktop Lyrics';

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function pointInBounds(point, bounds) {
  if (!point || !bounds) return false;
  return point.x >= bounds.x
    && point.x <= bounds.x + bounds.width
    && point.y >= bounds.y
    && point.y <= bounds.height;
}

function normalizeHotBounds(bounds) {
  const left = clampNumber(bounds && bounds.left, -2000, 4000, 0);
  const top = clampNumber(bounds && bounds.top, -2000, 4000, 0);
  const right = clampNumber(bounds && bounds.right, left + 1, 6000, left + 1);
  const bottom = clampNumber(bounds && bounds.bottom, top + 1, 6000, top + 1);
  return { left, top, right, bottom };
}

function normalizeDesktopLyricsUpdatePayload(payload = {}) {
  const next = { ...(payload || {}) };
  if (Object.prototype.hasOwnProperty.call(next, 'enabled')) {
    next.enabled = !!next.enabled;
  }
  if (Object.prototype.hasOwnProperty.call(next, 'clickThrough')) {
    next.clickThrough = !!next.clickThrough;
  }
  if (Object.prototype.hasOwnProperty.call(next, 'opacity')) {
    next.opacity = clampNumber(next.opacity, 0.28, 1, 0.92);
  }
  if (Object.prototype.hasOwnProperty.call(next, 'y')) {
    next.y = clampNumber(next.y, 0.08, 0.92, 0.76);
  }
  if (Object.prototype.hasOwnProperty.call(next, 'size')) {
    next.size = clampNumber(next.size, 0.72, 1.55, 1);
  }
  if (typeof next.text === 'string') {
    next.text = next.text.replace(/\s+/g, ' ').trim();
  }
  if (next.colors && typeof next.colors === 'object') {
    next.colors = { ...next.colors };
  }
  if (next.playback && typeof next.playback === 'object') {
    next.playback = {
      time: clampNumber(next.playback.time, 0, 86400, 0),
      duration: clampNumber(next.playback.duration, 0, 86400, 0),
      rate: clampNumber(next.playback.rate, 0.25, 4, 1),
    };
  }
  return next;
}

function createDesktopLyricsController(options = {}) {
  const {
    getMainWindow = () => null,
    getStore = () => null,
    isDevRuntime = () => false,
    isTrustedSender = () => true,
    onEnabledStateChange = () => {},
    onLockStateChange = () => {},
  } = options;

  let desktopLyricsWindow = null;
  let desktopLyricsState = {};
  let desktopLyricsUserBounds = null;
  let desktopLyricsProgrammaticMove = false;
  let desktopLyricsPointerCapture = false;
  let desktopLyricsMouseIgnored = null;
  let desktopLyricsMousePoller = null;
  let desktopLyricsMousePollerBuffer = '';
  let desktopLyricsHotBounds = null;
  let desktopLyricsLastMiddleAt = 0;

  function readStoredBounds() {
    const store = getStore();
    if (!store) return null;
    const stored = store.get(DESKTOP_LYRICS_SETTING_KEYS.userBounds);
    if (!stored || typeof stored !== 'object') return null;
    const width = Math.round(Number(stored.width));
    const height = Math.round(Number(stored.height));
    const x = Math.round(Number(stored.x));
    const y = Math.round(Number(stored.y));
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 320 || height < 180) {
      return null;
    }
    return {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
      width,
      height,
    };
  }

  function persistUserBounds(bounds) {
    const store = getStore();
    if (!store || !bounds) return;
    store.set(DESKTOP_LYRICS_SETTING_KEYS.userBounds, {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  }

  function loadPersistedPreferences() {
    const store = getStore();
    if (!store) return;
    desktopLyricsUserBounds = readStoredBounds();
    desktopLyricsState = {
      ...desktopLyricsState,
      y: clampNumber(store.get(DESKTOP_LYRICS_SETTING_KEYS.y), 0.08, 0.92, 0.76),
      opacity: clampNumber(store.get(DESKTOP_LYRICS_SETTING_KEYS.opacity), 0.28, 1, 0.92),
      clickThrough: desktopLyricsState.clickThrough !== false,
    };
  }

  function desktopLyricsDefaultBounds(payload = desktopLyricsState) {
    const display = desktopLyricsUserBounds
      ? screen.getDisplayMatching(desktopLyricsUserBounds)
      : screen.getPrimaryDisplay();
    const bounds = display.bounds;
    const yRatio = clampNumber(payload.y, 0.08, 0.92, 0.76);
    const width = Math.round(Math.min(Math.max(880, bounds.width * 0.72), bounds.width - 96));
    const height = Math.round(Math.min(Math.max(340, bounds.height * 0.38), 560, bounds.height - 96));
    return {
      x: Math.round(bounds.x + (bounds.width - width) / 2),
      y: Math.round(bounds.y + bounds.height * yRatio - height / 2),
      width,
      height,
    };
  }

  function constrainDesktopLyricsBounds(bounds) {
    const display = screen.getDisplayMatching(bounds);
    const area = display.bounds;
    const next = {
      ...bounds,
      width: Math.round(Math.min(Math.max(320, bounds.width), area.width)),
      height: Math.round(Math.min(Math.max(180, bounds.height), area.height)),
    };
    const maxX = area.x + Math.max(0, area.width - next.width);
    const maxY = area.y + Math.max(0, area.height - next.height);
    next.x = Math.round(clampNumber(next.x, area.x, maxX, area.x));
    next.y = Math.round(clampNumber(next.y, area.y, maxY, area.y));
    return next;
  }

  function setDesktopLyricsBounds(bounds) {
    if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed()) return;
    const nextBounds = constrainDesktopLyricsBounds(bounds);
    const currentBounds = desktopLyricsWindow.getBounds();
    if (
      currentBounds.x === nextBounds.x
      && currentBounds.y === nextBounds.y
      && currentBounds.width === nextBounds.width
      && currentBounds.height === nextBounds.height
    ) {
      return;
    }
    desktopLyricsProgrammaticMove = true;
    desktopLyricsWindow.setBounds(nextBounds, false);
    setTimeout(() => {
      desktopLyricsProgrammaticMove = false;
    }, 120);
  }

  function rememberDesktopLyricsBounds() {
    if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed() || desktopLyricsProgrammaticMove) return;
    desktopLyricsUserBounds = desktopLyricsWindow.getBounds();
    persistUserBounds(desktopLyricsUserBounds);
  }

  function applyDesktopLyricsMouseBehavior() {
    if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed()) return;
    const locked = desktopLyricsState.clickThrough !== false;
    const shouldIgnore = locked || !desktopLyricsPointerCapture;
    if (desktopLyricsMouseIgnored === shouldIgnore) return;
    desktopLyricsMouseIgnored = shouldIgnore;
    desktopLyricsWindow.setIgnoreMouseEvents(shouldIgnore, { forward: true });
  }

  function desktopLyricsHotBoundsOnScreen() {
    if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed()) return null;
    const winBounds = desktopLyricsWindow.getBounds();
    const rel = desktopLyricsHotBounds;
    if (!rel) return winBounds;
    return {
      x: winBounds.x + rel.left,
      y: winBounds.y + rel.top,
      width: Math.max(1, rel.right - rel.left),
      height: Math.max(1, rel.bottom - rel.top),
    };
  }

  function handleDesktopLyricsGlobalMiddleClick() {
    if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed()) return;
    if (!desktopLyricsState.enabled) return;
    const now = Date.now();
    if (now - desktopLyricsLastMiddleAt < 260) return;
    const point = screen.getCursorScreenPoint();
    if (!pointInBounds(point, desktopLyricsHotBoundsOnScreen())) return;
    desktopLyricsLastMiddleAt = now;
    const nextLocked = desktopLyricsState.clickThrough === false;
    desktopLyricsState = { ...desktopLyricsState, clickThrough: nextLocked };
    desktopLyricsPointerCapture = !nextLocked;
    applyDesktopLyricsMouseBehavior();
    broadcastDesktopLyricsLockState();
  }

  function startDesktopLyricsMousePoller() {
    if (desktopLyricsMousePoller) return;

    if (process.platform === 'win32') {
      const script = `
$ErrorActionPreference = "SilentlyContinue"
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class FoliaMousePoll {
  [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey);
}
"@
$prev = $false
while ($true) {
  $down = (([FoliaMousePoll]::GetAsyncKeyState(4) -band 0x8000) -ne 0)
  if ($down -and -not $prev) {
    [Console]::Out.WriteLine("MMB")
    [Console]::Out.Flush()
  }
  $prev = $down
  Start-Sleep -Milliseconds 24
}
`;
      try {
        desktopLyricsMousePoller = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        desktopLyricsMousePoller.stdout.on('data', (chunk) => {
          desktopLyricsMousePollerBuffer += chunk.toString('utf8');
          const lines = desktopLyricsMousePollerBuffer.split(/\r?\n/);
          desktopLyricsMousePollerBuffer = lines.pop() || '';
          lines.forEach((line) => {
            if (line.trim() === 'MMB') handleDesktopLyricsGlobalMiddleClick();
          });
        });
        desktopLyricsMousePoller.on('exit', () => {
          desktopLyricsMousePoller = null;
          desktopLyricsMousePollerBuffer = '';
        });
        desktopLyricsMousePoller.on('error', () => {
          desktopLyricsMousePoller = null;
          desktopLyricsMousePollerBuffer = '';
        });
      } catch (error) {
        desktopLyricsMousePoller = null;
        desktopLyricsMousePollerBuffer = '';
      }
      return;
    }

    // macOS: no reliable global middle-click poller without native addons.
    // Locked overlay toggle remains available via command palette / settings.
  }

  function stopDesktopLyricsMousePoller() {
    if (!desktopLyricsMousePoller) return;
    try {
      desktopLyricsMousePoller.kill();
    } catch (error) {}
    desktopLyricsMousePoller = null;
    desktopLyricsMousePollerBuffer = '';
  }

  function broadcastDesktopLyricsLockState() {
    const locked = desktopLyricsState.clickThrough !== false;
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(DESKTOP_LYRICS_IPC.lockStateEvent, { locked });
    }
    onLockStateChange(locked);
    sendDesktopLyricsState();
  }

  function broadcastDesktopLyricsEnabledState(enabled) {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(DESKTOP_LYRICS_IPC.enabledStateEvent, { enabled: !!enabled });
    }
    onEnabledStateChange(!!enabled);
  }

  function positionDesktopLyricsWindow(payload = desktopLyricsState, options = {}) {
    if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed()) return;
    const shouldUseManualBounds = desktopLyricsUserBounds && !options.force;
    setDesktopLyricsBounds(shouldUseManualBounds ? desktopLyricsUserBounds : desktopLyricsDefaultBounds(payload));
    if (typeof desktopLyricsWindow.setOpacity === 'function') {
      desktopLyricsWindow.setOpacity(clampNumber(payload.opacity, 0.28, 1, 0.92));
    }
  }

  function sendDesktopLyricsState() {
    if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed()) return;
    desktopLyricsWindow.webContents.send(DESKTOP_LYRICS_IPC.stateEvent, desktopLyricsState);
  }

  function loadDesktopLyricsEntry(win) {
    if (isDevRuntime()) {
      win.loadURL('http://localhost:3000/desktop-lyrics.html').catch((error) => {
        console.warn('Desktop lyrics dev load failed:', error.message);
      });
      return;
    }
    win.loadFile(path.join(__dirname, '../dist/desktop-lyrics.html')).catch((error) => {
      console.warn('Desktop lyrics load failed:', error.message);
    });
  }

  function createDesktopLyricsWindow(payload = {}) {
    const previousY = desktopLyricsState.y;
    const previousOpacity = desktopLyricsState.opacity;
    desktopLyricsState = { ...desktopLyricsState, ...normalizeDesktopLyricsUpdatePayload(payload), enabled: true };
    const hasY = Object.prototype.hasOwnProperty.call(payload || {}, 'y');
    const nextY = clampNumber(desktopLyricsState.y, 0.08, 0.92, 0.76);
    const yChanged = hasY && Number.isFinite(Number(previousY)) && Math.abs(nextY - clampNumber(previousY, 0.08, 0.92, 0.76)) > 0.001;
    const opacityChanged = Object.prototype.hasOwnProperty.call(payload || {}, 'opacity')
      && Math.abs(clampNumber(desktopLyricsState.opacity, 0.28, 1, 0.92) - clampNumber(previousOpacity, 0.28, 1, 0.92)) > 0.001;

    const store = getStore();
    if (store) {
      if (yChanged) {
        store.set(DESKTOP_LYRICS_SETTING_KEYS.y, nextY);
        desktopLyricsUserBounds = null;
      }
      if (opacityChanged) {
        store.set(DESKTOP_LYRICS_SETTING_KEYS.opacity, clampNumber(desktopLyricsState.opacity, 0.28, 1, 0.92));
      }
      store.set(DESKTOP_LYRICS_SETTING_KEYS.enabled, true);
    }

    if (yChanged) desktopLyricsUserBounds = null;

    if (desktopLyricsWindow && !desktopLyricsWindow.isDestroyed()) {
      if (yChanged) {
        positionDesktopLyricsWindow(desktopLyricsState, { force: yChanged });
      } else if (opacityChanged && typeof desktopLyricsWindow.setOpacity === 'function') {
        desktopLyricsWindow.setOpacity(clampNumber(desktopLyricsState.opacity, 0.28, 1, 0.92));
      }
      applyDesktopLyricsMouseBehavior();
      sendDesktopLyricsState();
      return desktopLyricsWindow;
    }

    desktopLyricsWindow = new BrowserWindow({
      width: 920,
      height: 190,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      resizable: false,
      movable: true,
      focusable: false,
      skipTaskbar: true,
      show: false,
      title: DESKTOP_LYRICS_WINDOW_TITLE,
      webPreferences: {
        preload: path.join(__dirname, 'desktopLyricsPreload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
      },
    });

    try {
      desktopLyricsWindow.setAlwaysOnTop(true, 'screen-saver');
      desktopLyricsWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } catch (error) {
      console.warn('Desktop lyrics topmost setup skipped:', error.message);
    }

    startDesktopLyricsMousePoller();
    applyDesktopLyricsMouseBehavior();
    positionDesktopLyricsWindow(desktopLyricsState, { force: yChanged || !desktopLyricsUserBounds });
    desktopLyricsWindow.once('ready-to-show', () => {
      if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed()) return;
      desktopLyricsWindow.showInactive();
      sendDesktopLyricsState();
    });
    desktopLyricsWindow.webContents.once('did-finish-load', sendDesktopLyricsState);
    desktopLyricsWindow.on('closed', () => {
      desktopLyricsWindow = null;
      desktopLyricsMouseIgnored = null;
    });
    desktopLyricsWindow.on('moved', rememberDesktopLyricsBounds);
    loadDesktopLyricsEntry(desktopLyricsWindow);
    return desktopLyricsWindow;
  }

  function closeDesktopLyricsWindow() {
    desktopLyricsState = { ...desktopLyricsState, enabled: false };
    desktopLyricsPointerCapture = false;
    desktopLyricsMouseIgnored = null;
    desktopLyricsHotBounds = null;
    stopDesktopLyricsMousePoller();

    const store = getStore();
    if (store) {
      store.set(DESKTOP_LYRICS_SETTING_KEYS.enabled, false);
    }

    if (desktopLyricsWindow && !desktopLyricsWindow.isDestroyed()) {
      sendDesktopLyricsState();
      desktopLyricsWindow.close();
    }
    desktopLyricsWindow = null;
    broadcastDesktopLyricsEnabledState(false);
  }

  function getStatus() {
    return {
      enabled: !!desktopLyricsState.enabled && !!(desktopLyricsWindow && !desktopLyricsWindow.isDestroyed()),
      locked: desktopLyricsState.clickThrough !== false,
      y: clampNumber(desktopLyricsState.y, 0.08, 0.92, 0.76),
      opacity: clampNumber(desktopLyricsState.opacity, 0.28, 1, 0.92),
      bounds: desktopLyricsUserBounds || (desktopLyricsWindow && !desktopLyricsWindow.isDestroyed()
        ? desktopLyricsWindow.getBounds()
        : null),
      middleClickPoller: process.platform === 'win32',
    };
  }

  function isTrustedDesktopLyricsSender(sender) {
    if (isTrustedSender(sender)) return true;
    if (desktopLyricsWindow && !desktopLyricsWindow.isDestroyed() && sender?.id === desktopLyricsWindow.webContents.id) {
      return true;
    }
    return false;
  }

  function registerIpcHandlers(ipcMain) {
    ipcMain.handle(DESKTOP_LYRICS_IPC.setEnabled, async (event, enabled, payload) => {
      if (!isTrustedSender(event.sender)) {
        return { ok: false, error: 'UNTRUSTED_SENDER' };
      }
      try {
        if (enabled) {
          createDesktopLyricsWindow(payload || {});
          broadcastDesktopLyricsEnabledState(true);
        } else {
          closeDesktopLyricsWindow();
        }
        return { ok: true, ...getStatus() };
      } catch (error) {
        return { ok: false, error: error.message || 'DESKTOP_LYRICS_FAILED' };
      }
    });

    ipcMain.handle(DESKTOP_LYRICS_IPC.update, async (event, payload) => {
      if (!isTrustedSender(event.sender)) {
        return { ok: false, error: 'UNTRUSTED_SENDER' };
      }
      try {
        const nextState = { ...desktopLyricsState, ...normalizeDesktopLyricsUpdatePayload(payload || {}) };
        if (nextState.enabled) {
          createDesktopLyricsWindow(payload || {});
        } else if (desktopLyricsWindow && !desktopLyricsWindow.isDestroyed()) {
          desktopLyricsState = nextState;
          sendDesktopLyricsState();
        } else {
          desktopLyricsState = nextState;
        }
        return { ok: true, ...getStatus() };
      } catch (error) {
        return { ok: false, error: error.message || 'DESKTOP_LYRICS_UPDATE_FAILED' };
      }
    });

    ipcMain.handle(DESKTOP_LYRICS_IPC.setDragging, async () => ({ ok: true }));

    ipcMain.handle(DESKTOP_LYRICS_IPC.setPointerCapture, async (event, active) => {
      if (!isTrustedDesktopLyricsSender(event.sender)) {
        return { ok: false, error: 'UNTRUSTED_SENDER' };
      }
      try {
        desktopLyricsPointerCapture = !!active;
        applyDesktopLyricsMouseBehavior();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message || 'DESKTOP_LYRICS_POINTER_FAILED' };
      }
    });

    ipcMain.handle(DESKTOP_LYRICS_IPC.setHotBounds, async (event, bounds) => {
      if (!isTrustedDesktopLyricsSender(event.sender)) {
        return { ok: false, error: 'UNTRUSTED_SENDER' };
      }
      try {
        desktopLyricsHotBounds = normalizeHotBounds(bounds);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message || 'DESKTOP_LYRICS_HOT_BOUNDS_FAILED' };
      }
    });

    ipcMain.handle(DESKTOP_LYRICS_IPC.setLockState, async (event, locked) => {
      if (!isTrustedDesktopLyricsSender(event.sender)) {
        return { ok: false, error: 'UNTRUSTED_SENDER' };
      }
      try {
        desktopLyricsState = { ...desktopLyricsState, clickThrough: !!locked };
        if (desktopLyricsState.clickThrough !== false) desktopLyricsPointerCapture = false;
        applyDesktopLyricsMouseBehavior();
        broadcastDesktopLyricsLockState();
        return { ok: true, locked: desktopLyricsState.clickThrough !== false };
      } catch (error) {
        return { ok: false, error: error.message || 'DESKTOP_LYRICS_LOCK_FAILED' };
      }
    });

    ipcMain.handle(DESKTOP_LYRICS_IPC.moveBy, async (event, dx, dy) => {
      if (!isTrustedDesktopLyricsSender(event.sender)) {
        return { ok: false, error: 'UNTRUSTED_SENDER' };
      }
      try {
        if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed()) {
          return { ok: false, error: 'NO_DESKTOP_LYRICS_WINDOW' };
        }
        if (desktopLyricsState.clickThrough !== false) {
          return { ok: false, error: 'DESKTOP_LYRICS_LOCKED' };
        }
        const bounds = desktopLyricsWindow.getBounds();
        const next = {
          ...bounds,
          x: Math.round(bounds.x + clampNumber(dx, -160, 160, 0)),
          y: Math.round(bounds.y + clampNumber(dy, -160, 160, 0)),
        };
        desktopLyricsWindow.setBounds(next, false);
        desktopLyricsUserBounds = desktopLyricsWindow.getBounds();
        persistUserBounds(desktopLyricsUserBounds);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message || 'DESKTOP_LYRICS_MOVE_FAILED' };
      }
    });

    ipcMain.handle(DESKTOP_LYRICS_IPC.getStatus, async (event) => {
      if (!isTrustedSender(event.sender)) {
        return { enabled: false, locked: true, error: 'UNTRUSTED_SENDER' };
      }
      return getStatus();
    });
  }

  function handleDisplayMetricsChanged() {
    positionDesktopLyricsWindow();
  }

  function restoreEnabledFromStore() {
    const store = getStore();
    if (!store || !store.get(DESKTOP_LYRICS_SETTING_KEYS.enabled)) return;
    createDesktopLyricsWindow(desktopLyricsState);
    broadcastDesktopLyricsEnabledState(true);
  }

  loadPersistedPreferences();

  return {
    DESKTOP_LYRICS_IPC,
    DESKTOP_LYRICS_SETTING_KEYS,
    createDesktopLyricsWindow,
    closeDesktopLyricsWindow,
    updateDesktopLyricsState: (payload = {}) => {
      const nextState = { ...desktopLyricsState, ...normalizeDesktopLyricsUpdatePayload(payload) };
      if (nextState.enabled) {
        createDesktopLyricsWindow(payload);
      } else if (desktopLyricsWindow && !desktopLyricsWindow.isDestroyed()) {
        desktopLyricsState = nextState;
        sendDesktopLyricsState();
      } else {
        desktopLyricsState = nextState;
      }
    },
    getStatus,
    registerIpcHandlers,
    handleDisplayMetricsChanged,
    restoreEnabledFromStore,
    destroy: () => {
      closeDesktopLyricsWindow();
    },
  };
}

module.exports = {
  DESKTOP_LYRICS_IPC,
  DESKTOP_LYRICS_SETTING_KEYS,
  clampNumber,
  normalizeHotBounds,
  normalizeDesktopLyricsUpdatePayload,
  createDesktopLyricsController,
};
