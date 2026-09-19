import React from 'react';
import { Play } from 'lucide-react';
import type { SongResult } from '../../../types';
import LazyCoverImage from '../../shared/LazyCoverImage';
import { ProviderIconBadge } from './ProviderIconBadge';
import {
    LISTENING_DESK_SKELETON,
    listeningDeskArtist,
    listeningDeskCoverUrl,
    listeningDeskFieldClass,
    listeningDeskTileClass,
    type ListeningDeskFieldMode,
} from '../../../utils/home/listeningDeskMath';
import { HOME_COVER_TILE_DECODE_PX } from '../../../utils/home/discoveryRailMath';

// src/components/app/home/HomeListeningMosaic.tsx
// Stage mode is a Folia-like cover field; strip mode stays a compact logged-in row.

type HomeListeningMosaicProps = {
    songs: readonly SongResult[];
    queue: readonly SongResult[];
    isDaylight: boolean;
    mode?: ListeningDeskFieldMode;
    skeleton?: boolean;
    onPlaySong: (song: SongResult, queue?: SongResult[]) => void;
};

const HomeListeningMosaic: React.FC<HomeListeningMosaicProps> = ({
    songs,
    queue,
    isDaylight,
    mode = 'strip',
    skeleton = false,
    onPlaySong,
}) => {
    const frame = isDaylight ? 'bg-black/[0.06]' : 'bg-white/10';
    const fieldClass = listeningDeskFieldClass(mode);

    if (skeleton && songs.length === 0) {
        return (
            <div className={fieldClass}>
                {Array.from({ length: LISTENING_DESK_SKELETON }, (_, index) => (
                    <div
                        key={`desk-skel-${index}`}
                        className={`rounded-xl ${frame} animate-pulse ${listeningDeskTileClass(mode, index)}`}
                    />
                ))}
            </div>
        );
    }

    if (songs.length === 0) return null;

    return (
        <div className={fieldClass}>
            {songs.map((song, index) => {
                const artist = listeningDeskArtist(song);
                const isHero = mode === 'stage' && index === 0;
                return (
                    <button
                        key={`${song.musicProvider || 'desk'}-${song.id}-${index}`}
                        type="button"
                        onClick={() => onPlaySong(song, [...queue])}
                        title={`${song.name}${artist ? ` · ${artist}` : ''}`}
                        className={`group relative overflow-hidden rounded-lg text-left ${listeningDeskTileClass(mode, index)}`}
                    >
                        <div className={`h-full w-full ${frame}`}>
                            <LazyCoverImage
                                src={listeningDeskCoverUrl(song)}
                                placeholderLabel={song.name}
                                placeholderArtist={artist}
                                sizePx={isHero ? 320 : HOME_COVER_TILE_DECODE_PX}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            />
                        </div>
                        {mode === 'stage' ? (
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90" />
                        ) : null}
                        <span className={`absolute inline-flex items-center justify-center rounded-full bg-white text-zinc-950 shadow-sm transition-opacity ${
                            isHero
                                ? 'left-2.5 top-2.5 h-8 w-8 opacity-95'
                                : 'left-1 top-1 h-5 w-5 opacity-0 group-hover:opacity-100'
                        }`}>
                            <Play size={isHero ? 13 : 9} fill="currentColor" />
                        </span>
                        {mode === 'stage' ? (
                            <span className="absolute right-2 top-2">
                                <ProviderIconBadge
                                    provider={song.musicProvider}
                                    size={isHero ? 'md' : 'sm'}
                                    isDaylight={false}
                                />
                            </span>
                        ) : null}
                        {mode === 'stage' ? (
                        <span className={`absolute inset-x-2.5 bottom-2.5 text-white drop-shadow-sm ${isHero ? 'space-y-0.5' : ''}`}>
                            <span className={`block truncate font-semibold leading-tight ${isHero ? 'text-sm md:text-base' : 'text-[11px]'}`}>
                                {song.name}
                            </span>
                            {isHero && artist ? (
                                <span className="block truncate text-[11px] font-medium text-white/80">
                                    {artist}
                                </span>
                            ) : null}
                        </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
};

export default HomeListeningMosaic;
