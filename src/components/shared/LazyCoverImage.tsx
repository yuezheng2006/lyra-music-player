import React, { useEffect, useMemo, useState } from 'react';
import {
    createCoverPlaceholder,
    createSongCoverPlaceholder,
} from '../../utils/coverPlaceholders';
import { getSizedCoverUrl } from '../../utils/coverUrl';

// src/components/shared/LazyCoverImage.tsx
// Shared list/thumbnail cover: native lazy load + SVG placeholder while loading / on miss / on error.

export type LazyCoverPlaceholderVariant = 'song' | 'playlist' | 'artist';

export type LazyCoverImageProps = {
    src?: string | null;
    alt?: string;
    className?: string;
    /** Seed text for the generated SVG fallback. */
    placeholderLabel?: string;
    /** Optional artist line — only used for song placeholders. */
    placeholderArtist?: string;
    placeholderVariant?: LazyCoverPlaceholderVariant;
    /** When set, rewrite remote covers through getSizedCoverUrl. */
    sizePx?: number;
    decoding?: 'async' | 'auto' | 'sync';
    draggable?: boolean;
};

const buildPlaceholderSrc = (input: {
    placeholderLabel?: string;
    placeholderArtist?: string;
    placeholderVariant?: LazyCoverPlaceholderVariant;
}): string => {
    const variant = input.placeholderVariant ?? 'song';
    const label = input.placeholderLabel?.trim() || '';
    return variant === 'song'
        ? createSongCoverPlaceholder(label || null, input.placeholderArtist)
        : createCoverPlaceholder(label || variant, variant);
};

/** Resolve the image URL shown after miss / error fallback. */
export const resolveLazyCoverDisplaySrc = (input: {
    src?: string | null;
    failed?: boolean;
    placeholderLabel?: string;
    placeholderArtist?: string;
    placeholderVariant?: LazyCoverPlaceholderVariant;
    sizePx?: number;
}): string => {
    const fallback = buildPlaceholderSrc(input);
    const raw = typeof input.src === 'string' ? input.src.trim() : '';
    if (!raw || input.failed) return fallback;

    if (input.sizePx && input.sizePx > 0 && !raw.startsWith('data:') && !raw.startsWith('blob:')) {
        return getSizedCoverUrl(raw, input.sizePx) || fallback;
    }
    return raw;
};

const LazyCoverImage: React.FC<LazyCoverImageProps> = ({
    src,
    alt = '',
    className,
    placeholderLabel,
    placeholderArtist,
    placeholderVariant = 'song',
    sizePx,
    decoding = 'async',
    draggable = false,
}) => {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src, sizePx, placeholderLabel, placeholderArtist, placeholderVariant]);

    const placeholderSrc = useMemo(
        () => buildPlaceholderSrc({
            placeholderLabel,
            placeholderArtist,
            placeholderVariant,
        }),
        [placeholderLabel, placeholderArtist, placeholderVariant],
    );

    const displaySrc = useMemo(
        () => resolveLazyCoverDisplaySrc({
            src,
            failed,
            placeholderLabel,
            placeholderArtist,
            placeholderVariant,
            sizePx,
        }),
        [src, failed, placeholderLabel, placeholderArtist, placeholderVariant, sizePx],
    );

    const showingRemote = Boolean(displaySrc) && displaySrc !== placeholderSrc;

    return (
        <img
            src={displaySrc}
            alt={alt}
            className={className}
            loading="lazy"
            decoding={decoding}
            draggable={draggable}
            // Show SVG兜底 as CSS background until the remote cover paints.
            style={showingRemote
                ? {
                    backgroundImage: `url("${placeholderSrc}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }
                : undefined}
            onError={() => {
                if (!failed) setFailed(true);
            }}
        />
    );
};

export default LazyCoverImage;
