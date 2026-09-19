import { useEffect, useState } from 'react';
import {
    NOW_PLAYING_PROBE_INTERVAL_MS,
    probeNowPlayingService,
    type NowPlayingProbeStatus,
} from '../utils/nowPlaying/nowPlayingServiceProbe';

// src/hooks/useNowPlayingServiceProbe.ts
// Poll localhost:9863 while the Now Playing stage source is selected.

export const useNowPlayingServiceProbe = (enabled: boolean): NowPlayingProbeStatus => {
    const [status, setStatus] = useState<NowPlayingProbeStatus>(enabled ? 'checking' : 'idle');

    useEffect(() => {
        if (!enabled) {
            setStatus('idle');
            return;
        }

        let cancelled = false;
        const run = async () => {
            const ok = await probeNowPlayingService();
            if (!cancelled) setStatus(ok ? 'reachable' : 'unreachable');
        };

        setStatus(current => (current === 'reachable' ? current : 'checking'));
        void run();
        const intervalId = window.setInterval(() => { void run(); }, NOW_PLAYING_PROBE_INTERVAL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [enabled]);

    return status;
};
