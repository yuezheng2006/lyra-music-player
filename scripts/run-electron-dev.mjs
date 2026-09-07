#!/usr/bin/env node
/**
 * Holds the concurrently slot so GPU software-GL escape (exit 75) can restart
 * Electron only — vite / sidecars stay up. A normal quit (close / Cmd+Q / code 0)
 * is final: this wrapper exits and concurrently -k tears down the stack.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    ELECTRON_DEV_RESTART_EXIT_CODE,
    shouldRestartElectronDev,
} from './electronDevRestartPolicy.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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
        env: {
            ...process.env,
            // Must be set in the process env before Electron boots (Vite HMR uses unsafe-eval).
            ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
        },
    });

    child.on('exit', (code, signal) => {
        child = null;
        if (!shouldRestartElectronDev(code, { shuttingDown })) {
            console.warn(
                `[run-electron-dev] Electron exited code=${code} signal=${signal ?? 'none'}; not restarting.`,
            );
            process.exit(typeof code === 'number' ? code : signal ? 1 : 0);
            return;
        }
        if (restarting) return;
        restarting = true;
        console.warn(
            `[run-electron-dev] Electron exited code=${ELECTRON_DEV_RESTART_EXIT_CODE}; restarting Electron only (GPU software-GL escape)…`,
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
