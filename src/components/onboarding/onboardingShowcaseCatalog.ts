// src/components/onboarding/onboardingShowcaseCatalog.ts
// Curated premiere demo tracks, lyrics, and artist cards for the interactive stage.

export type ShowcaseTrack = {
    id: string;
    title: string;
    artist: string;
    album: string;
    gradient: string;
    accent: string;
};

export type ShowcaseLyricLine = {
    id: string;
    text: string;
    trackId: string;
};

export type ShowcaseArtist = {
    id: string;
    name: string;
    role: string;
    gradient: string;
    initial: string;
};

export const SHOWCASE_TRACKS: ShowcaseTrack[] = [
    {
        id: 'aurora',
        title: 'Aurora Drift',
        artist: 'Lyra Ensemble',
        album: 'Night Orbit',
        gradient: 'linear-gradient(145deg, #1b2a4a 0%, #5b7cfa 45%, #c9d4ff 100%)',
        accent: '#8eb6ff',
    },
    {
        id: 'ember',
        title: 'Ember Chorus',
        artist: 'Nova Lane',
        album: 'Warm Signal',
        gradient: 'linear-gradient(145deg, #3a1a12 0%, #d97757 50%, #ffe0c2 100%)',
        accent: '#ffb089',
    },
    {
        id: 'glass',
        title: 'Glass Harbor',
        artist: 'Silent Pier',
        album: 'Blue Hours',
        gradient: 'linear-gradient(145deg, #0f2428 0%, #2dd4bf 48%, #d8fff7 100%)',
        accent: '#7ef0d8',
    },
    {
        id: 'velvet',
        title: 'Velvet Frequency',
        artist: 'Mira Sol',
        album: 'Soft Grid',
        gradient: 'linear-gradient(145deg, #24152f 0%, #a78bfa 50%, #f5e9ff 100%)',
        accent: '#d2b8ff',
    },
    {
        id: 'pulse',
        title: 'City Pulse',
        artist: 'Eastline',
        album: 'Afterglow',
        gradient: 'linear-gradient(145deg, #1a1020 0%, #f472b6 48%, #ffe4f1 100%)',
        accent: '#ff9ec8',
    },
];

export const SHOWCASE_LYRICS: ShowcaseLyricLine[] = [
    { id: 'l1', text: '在光落下的缝隙里听见你', trackId: 'aurora' },
    { id: 'l2', text: 'Let the night orbit around this room', trackId: 'aurora' },
    { id: 'l3', text: '余烬还在跳，像一句未说完的副歌', trackId: 'ember' },
    { id: 'l4', text: 'Warm signals crossing every quiet street', trackId: 'ember' },
    { id: 'l5', text: '玻璃港湾倒映着迟到的潮汐', trackId: 'glass' },
    { id: 'l6', text: 'Blue hours hold the harbor still', trackId: 'glass' },
    { id: 'l7', text: '柔软的频率穿过整座城市', trackId: 'velvet' },
    { id: 'l8', text: 'Soft grids blooming under violet rain', trackId: 'velvet' },
    { id: 'l9', text: '霓虹心跳对齐这一拍', trackId: 'pulse' },
    { id: 'l10', text: 'Afterglow keeps dancing on the glass', trackId: 'pulse' },
];

export const SHOWCASE_ARTISTS: ShowcaseArtist[] = [
    { id: 'a1', name: 'Lyra Ensemble', role: 'Stage collective', gradient: 'linear-gradient(160deg,#314e7a,#9db7ff)', initial: 'L' },
    { id: 'a2', name: 'Nova Lane', role: 'Vocal / Write', gradient: 'linear-gradient(160deg,#7a3a28,#ffb089)', initial: 'N' },
    { id: 'a3', name: 'Silent Pier', role: 'Producer', gradient: 'linear-gradient(160deg,#1d5a55,#7ef0d8)', initial: 'S' },
    { id: 'a4', name: 'Mira Sol', role: 'Synth / Keys', gradient: 'linear-gradient(160deg,#4b2f78,#d2b8ff)', initial: 'M' },
];

export function getShowcaseTrack(trackId: string): ShowcaseTrack {
    return SHOWCASE_TRACKS.find(track => track.id === trackId) ?? SHOWCASE_TRACKS[0];
}
