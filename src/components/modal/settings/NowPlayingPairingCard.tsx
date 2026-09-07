import React from 'react';
import { useTranslation } from 'react-i18next';
import type { NowPlayingConnectionStatus } from '../../../types';
import { useNowPlayingServiceProbe } from '../../../hooks/useNowPlayingServiceProbe';
import {
    NOW_PLAYING_HTTP_ORIGIN,
    NOW_PLAYING_SERVICE_REPO,
} from '../../../utils/nowPlaying/nowPlayingServiceProbe';
import {
    settingsDescClass,
    settingsDescStyle,
    settingsFootnoteClass,
    settingsFootnoteStyle,
} from './settingsTextStyles';

// src/components/modal/settings/NowPlayingPairingCard.tsx
// Windows sidecar pairing: WS status plus a localhost:9863 probe.

type NowPlayingPairingCardProps = {
    connectionStatus: NowPlayingConnectionStatus;
    settingsCardClass: string;
};

const NowPlayingPairingCard: React.FC<NowPlayingPairingCardProps> = ({
    connectionStatus,
    settingsCardClass,
}) => {
    const { t } = useTranslation();
    const probeStatus = useNowPlayingServiceProbe(true);

    const wsLabel = connectionStatus === 'connected'
        ? t('options.nowPlayingWsConnected')
        : connectionStatus === 'connecting'
            ? t('options.nowPlayingWsConnecting')
            : connectionStatus === 'error'
                ? t('options.nowPlayingWsError')
                : t('options.nowPlayingWsDisabled');

    const probeLabel = probeStatus === 'reachable'
        ? t('options.nowPlayingProbeReachable')
        : probeStatus === 'unreachable'
            ? t('options.nowPlayingProbeUnreachable')
            : probeStatus === 'checking'
                ? t('options.nowPlayingProbeChecking')
                : t('options.nowPlayingProbeIdle');

    return (
        <div className={`rounded-xl border p-3 space-y-2 ${settingsCardClass}`}>
            <div className={`uppercase tracking-[0.16em] ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                Now Playing
            </div>
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('options.nowPlayingWsStatus', { status: wsLabel })}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('options.nowPlayingProbeStatus', { status: probeLabel })}
            </div>
            <p className={settingsDescClass} style={settingsDescStyle}>
                {t('options.nowPlayingSidecarHint', { origin: NOW_PLAYING_HTTP_ORIGIN })}
            </p>
            <p className={settingsDescClass} style={settingsDescStyle}>
                {t('options.nowPlayingWindowsOnly')}
            </p>
            <a
                href={NOW_PLAYING_SERVICE_REPO}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs underline-offset-2 hover:underline"
                style={{ color: 'var(--text-primary)' }}
            >
                {t('options.nowPlayingServiceLink')}
            </a>
        </div>
    );
};

export default NowPlayingPairingCard;
