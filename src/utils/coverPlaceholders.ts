type PlaceholderVariant = 'artist' | 'playlist' | 'song';

const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
const hashString = (value: string) => Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);

const getDisplayText = (label: string, fallback: string) => {
    const trimmed = label.trim();
    if (!trimmed) {
        return fallback;
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        return words
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join('');
    }

    return Array.from(trimmed).slice(0, 2).join('').toUpperCase();
};

export const createCoverPlaceholder = (
    label: string,
    variant: PlaceholderVariant = 'playlist'
): string => {
    const palettes: Record<PlaceholderVariant, Array<{ start: string; end: string; text: string; }>> = {
        artist: [
            { start: '#dbeafe', end: '#bfdbfe', text: '#1e3a8a' },
            { start: '#e0f2fe', end: '#bae6fd', text: '#0f3a5b' },
            { start: '#ede9fe', end: '#ddd6fe', text: '#4c1d95' },
            { start: '#fce7f3', end: '#fbcfe8', text: '#831843' },
        ],
        playlist: [
            { start: '#dcfce7', end: '#bbf7d0', text: '#166534' },
            { start: '#ecfccb', end: '#d9f99d', text: '#365314' },
            { start: '#fef3c7', end: '#fde68a', text: '#92400e' },
            { start: '#fee2e2', end: '#fecaca', text: '#991b1b' },
        ],
        song: [
            { start: '#1f2937', end: '#4b5563', text: '#f8fafc' },
            { start: '#312e81', end: '#6366f1', text: '#eef2ff' },
            { start: '#7c2d12', end: '#ea580c', text: '#fff7ed' },
            { start: '#134e4a', end: '#0d9488', text: '#f0fdfa' },
            { start: '#4c0519', end: '#be123c', text: '#fff1f2' },
            { start: '#1e3a8a', end: '#3b82f6', text: '#eff6ff' },
        ],
    };

    const fallbackSymbol = variant === 'artist' ? 'A' : variant === 'song' ? '♪' : 'M';
    const symbol = getDisplayText(label, fallbackSymbol);
    const paletteGroup = palettes[variant];
    const paletteIndex = hashString(`${variant}:${label.trim().toLowerCase()}`) % paletteGroup.length;
    const config = paletteGroup[paletteIndex];
    const fontSize = symbol.length > 1 ? 148 : 168;
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${config.start}" />
                    <stop offset="100%" stop-color="${config.end}" />
                </linearGradient>
            </defs>
            <rect width="600" height="600" fill="url(#bg)" />
            <circle cx="300" cy="300" r="168" fill="rgba(255,255,255,0.08)" />
            <circle cx="300" cy="300" r="54" fill="rgba(255,255,255,0.12)" />
            <text
                x="300"
                y="320"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="${fontSize}"
                font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                font-weight="700"
                letter-spacing="8"
                fill="${config.text}"
            >${symbol}</text>
        </svg>
    `;

    return svgToDataUrl(svg);
};

/** Stable default cover when a track has no album art. */
export const createSongCoverPlaceholder = (
    songName?: string | null,
    artistName?: string | null,
): string => {
    const label = [songName, artistName].map(part => part?.trim()).filter(Boolean).join(' · ') || 'Song';
    return createCoverPlaceholder(label, 'song');
};

/** Fixed cover for the virtual local "All Songs" group — never derived from track art. */
export const createLocalAllSongsCover = (): string => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
            <defs>
                <linearGradient id="allSongsBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0f172a" />
                    <stop offset="100%" stop-color="#1e293b" />
                </linearGradient>
            </defs>
            <rect width="600" height="600" fill="url(#allSongsBg)" />
            <rect x="150" y="210" width="300" height="220" rx="28" fill="rgba(148,163,184,0.18)" />
            <rect x="178" y="178" width="244" height="36" rx="12" fill="rgba(148,163,184,0.12)" />
            <rect x="198" y="146" width="204" height="28" rx="10" fill="rgba(148,163,184,0.08)" />
            <circle cx="300" cy="318" r="54" fill="rgba(226,232,240,0.92)" />
            <circle cx="300" cy="318" r="18" fill="#0f172a" />
            <path d="M318 286 L348 274 L348 336 L330 342 L330 302 Z" fill="rgba(226,232,240,0.92)" />
        </svg>
    `;

    return svgToDataUrl(svg);
};

export const resolveNavidromeArtistCoverUrl = (
    artist: { coverArt?: string; artistImageUrl?: string; },
    getCoverArtUrl: (coverArtId: string, size?: number) => string,
    size = 600
): string | undefined => {
    if (artist.artistImageUrl) {
        return artist.artistImageUrl;
    }

    if (artist.coverArt) {
        return getCoverArtUrl(artist.coverArt, size);
    }

    return undefined;
};

export const pickRandomSongCoverUrl = (
    songs: Array<{ coverArt?: string; }>,
    getCoverArtUrl: (coverArtId: string, size?: number) => string,
    size = 600,
    maxAttempts = 3
): string | undefined => {
    if (!songs.length) {
        return undefined;
    }

    const pool = [...songs];

    for (let attempt = 0; attempt < maxAttempts && pool.length > 0; attempt += 1) {
        const index = Math.floor(Math.random() * pool.length);
        const [candidate] = pool.splice(index, 1);
        if (candidate?.coverArt) {
            return getCoverArtUrl(candidate.coverArt, size);
        }
    }

    return undefined;
};
