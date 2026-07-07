const { serveNcmApi } = require('@neteasecloudmusicapienhanced/api/server');

// scripts/dev-netease-api.cjs
// Starts the embedded Netease Cloud Music API for local web development.

const port = Number(process.env.NETEASE_API_PORT || 3001);

serveNcmApi({ port })
    .then(() => {
        console.log(`[dev-netease-api] listening on http://127.0.0.1:${port}`);
    })
    .catch((error) => {
        console.error('[dev-netease-api] failed to start', error);
        process.exit(1);
    });
