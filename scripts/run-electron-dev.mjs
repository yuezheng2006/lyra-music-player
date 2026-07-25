#!/usr/bin/env node
/**
 * Keeps the concurrently slot alive across Electron exits so GPU-crash
 * recovery / agent recycles can restart only Electron (vite / sidecars stay up).
 * Exit code 75 is the explicit software-GL escape signal from electron/main.cjs.
 * Any other exit also restarts — stop the whole stack with Ctrl+C on npm run.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** Electron exit code requesting a clean process restart (escape --use-gl=disabled). */
export const ELECTRON_DEV_RESTART_EXIT_CODE = 75;

const electronBin = require('electron');
const remoteDebuggingPort = process.env.LYRA_REMOTE_DEBUGGING_PORT || '9229';

let child = null;
let shuttingDown = false;
let restarting = false;

function startElectron() {
    const userArgs = process.argv.slice(2);
    const args = [
        `--remote-debugging-port=${remoteDebuggingPort}`,
        ...(userArgs.length > 0 ? userArgs : ['.']),
    ];
    child = spawn(electronBin, args, {
        cwd: root,
        stdio: 'inherit',
        env: process.env,
    });

    child.on('exit', (code, signal) => {
        child = null;
        if (shuttingDown) {
            process.exit(typeof code === 'number' ? code : signal ? 1 : 0);
            return;
        }
        if (restarting) return;
        restarting = true;
        console.warn(
            `[run-electron-dev] Electron exited code=${code} signal=${signal ?? 'none'}; restarting Electron only…`,
        );
        setTimeout(() => {
            restarting = false;
            startElectron();
        }, 400);
    });
}

const stop = (signal) => {
    shuttingDown = true;
    if (child && !child.killed) {
        child.kill(signal);
    } else {
        process.exit(0);
    }
};

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

startElectron();
