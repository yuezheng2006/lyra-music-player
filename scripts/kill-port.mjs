#!/usr/bin/env node
// scripts/kill-port.mjs
// Frees a TCP port before starting local dev servers.

import { execSync } from 'node:child_process';

const ports = process.argv.slice(2).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);

if (ports.length === 0) {
    console.error('[kill-port] Usage: node scripts/kill-port.mjs <port> [port...]');
    process.exit(1);
}

for (const port of ports) {
    try {
        const output = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
        if (!output) continue;

        const pids = [...new Set(output.split('\n').filter(Boolean))];
        for (const pid of pids) {
            try {
                process.kill(Number(pid), 'SIGTERM');
                console.log(`[kill-port] terminated pid ${pid} on port ${port}`);
            } catch (error) {
                console.warn(`[kill-port] failed to terminate pid ${pid} on port ${port}:`, error);
            }
        }
    } catch {
        // No process is listening on this port.
    }
}
