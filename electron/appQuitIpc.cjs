// Explicit full-app quit for sleep timer. Unlike window-close, this quits even when
// closing-to-tray is enabled, and still runs before-quit cleanup.

function registerAppQuitIpc(ipcMain, { isTrustedSender, quitApp }) {
  ipcMain.handle('app-quit', (event) => {
    if (!isTrustedSender(event.sender)) {
      return false;
    }
    quitApp();
    return true;
  });
}

module.exports = { registerAppQuitIpc };
