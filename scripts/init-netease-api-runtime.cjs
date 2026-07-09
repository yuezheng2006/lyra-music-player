const fs = require('fs');
const os = require('os');
const path = require('path');
const { register_anonimous } = require('@neteasecloudmusicapienhanced/api/main');
const { getXeapiPublicKey } = require('@neteasecloudmusicapienhanced/api/util/xeapiKey');
const {
    cookieToJson,
    generateDeviceId,
    generateRandomChineseIP,
} = require('@neteasecloudmusicapienhanced/api/util/index');

// scripts/init-netease-api-runtime.cjs
// Prepares device identity and anonymous token before the Netease API server starts.

const tokenPath = path.resolve(os.tmpdir(), 'anonymous_token');
const xeapiPublicKeyPath = path.resolve(os.tmpdir(), 'xeapi_public_key');

async function initializeNcmApiRuntime() {
    global.cnIp = generateRandomChineseIP();

    if (!global.deviceId) {
        global.deviceId = generateDeviceId();
    }

    if (!fs.existsSync(tokenPath)) {
        fs.writeFileSync(tokenPath, '', 'utf-8');
    }

    let currentPublicKey = {};
    if (fs.existsSync(xeapiPublicKeyPath)) {
        try {
            currentPublicKey = JSON.parse(fs.readFileSync(xeapiPublicKeyPath, 'utf-8'));
        } catch (error) {
            console.warn('[Netease API] Failed to read cached xeapi public key, regenerating', error);
        }
    }

    const nextPublicKey = await getXeapiPublicKey(currentPublicKey, global.deviceId);
    fs.writeFileSync(xeapiPublicKeyPath, JSON.stringify(nextPublicKey), 'utf-8');

    const anonymousRegistration = await register_anonimous();
    const anonymousCookie = anonymousRegistration?.body?.cookie;
    if (typeof anonymousCookie === 'string' && anonymousCookie.trim()) {
        const cookieObject = cookieToJson(anonymousCookie);
        if (typeof cookieObject.MUSIC_A === 'string') {
            fs.writeFileSync(tokenPath, cookieObject.MUSIC_A, 'utf-8');
        }
    }
}

module.exports = {
    initializeNcmApiRuntime,
    tokenPath,
};
