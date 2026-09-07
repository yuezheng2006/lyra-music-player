// src/utils/podcastProxyHosts.ts
// Apple catalog hosts plus public-http SSRF guards for RSS feed proxying.

const APPLE_CATALOG_HOST_SUFFIXES = [
    'itunes.apple.com',
    'rss.applemarketingtools.com',
    'podcasts.apple.com',
] as const;

export const PODCAST_PROXY_MAX_BYTES = 5 * 1024 * 1024;

const parseIpv4 = (hostname: string): [number, number, number, number] | null => {
    if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return null;
    const parts = hostname.split('.').map((part) => Number(part));
    if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
    return [parts[0], parts[1], parts[2], parts[3]] as [number, number, number, number];
};

const isPrivateIpv4 = (parts: [number, number, number, number]): boolean => {
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
    return false;
};

const isPrivateIpv6 = (hostname: string): boolean => {
    const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (host === '::' || host === '::1') return true;
    if (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true;
    const mapped = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (mapped) {
        const parts = parseIpv4(mapped[1]);
        return parts ? isPrivateIpv4(parts) : true;
    }
    return false;
};

export const isPrivatePodcastProxyHostname = (hostname: string): boolean => {
    if (!hostname) return true;
    const host = hostname.toLowerCase().replace(/\.$/, '');
    if (host === 'localhost' || host.endsWith('.localhost')) return true;
    if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.arpa')) return true;
    const ipv4 = parseIpv4(host);
    if (ipv4) return isPrivateIpv4(ipv4);
    if (host.includes(':')) return isPrivateIpv6(host);
    return false;
};

export const isApplePodcastCatalogHost = (hostname: string): boolean => {
    if (!hostname) return false;
    const host = hostname.toLowerCase();
    return APPLE_CATALOG_HOST_SUFFIXES.some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
};

/** GET catalog/RSS proxy may hit Apple hosts or any public http(s) feed URL. */
export const isAllowedPodcastProxyUrl = (urlString: string): boolean => {
    if (!urlString || typeof urlString !== 'string') return false;
    try {
        const target = new URL(urlString);
        if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;
        if (target.username || target.password) return false;
        if (isPrivatePodcastProxyHostname(target.hostname)) return false;
        return true;
    } catch {
        return false;
    }
};
