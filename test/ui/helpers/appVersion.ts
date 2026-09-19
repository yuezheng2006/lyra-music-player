import { createRequire } from 'node:module';

// test/ui/helpers/appVersion.ts
// 单一真相：What's New 弹窗按 folia_last_seen_guide_version !== 当前版本 触发，
// 测试里必须写入真实 package.json 版本，硬编码会在版本升级后挡住所有点击。

const require = createRequire(import.meta.url);

export const APP_VERSION: string = require('../../../package.json').version;
