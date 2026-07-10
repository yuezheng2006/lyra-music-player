const { serveNcmApi } = require('@neteasecloudmusicapienhanced/api/server');
const { initializeNcmApiRuntime } = require('./init-netease-api-runtime.cjs');

// scripts/dev-netease-api.cjs
// Starts the embedded Netease Cloud Music API for local web development.

process.env.ENABLE_GENERAL_UNBLOCK = 'false';

const port = Number(process.env.NETEASE_API_PORT || 3001);

initializeNcmApiRuntime()
    .then(() => serveNcmApi({ port }))
    .then(() => {
        console.log(`[dev-netease-api] listening on http://127.0.0.1:${port}`);
    })
    .catch((error) => {
        console.error('[dev-netease-api] failed to start', error);
        process.exit(1);
    });
