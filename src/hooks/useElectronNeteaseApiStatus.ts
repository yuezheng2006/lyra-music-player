import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { StatusMessage } from '../types';

// src/hooks/useElectronNeteaseApiStatus.ts

type StatusSetter = Dispatch<SetStateAction<StatusMessage | null>>;

const restartNeteaseApi = async (): Promise<ElectronNeteaseApiStatus | null> => {
    const restart = window.electron?.restartNeteaseApi;
    if (!restart) return null;
    return restart();
};

// Watches the Electron NetEase API startup state and surfaces backend failures through the app toast.
export function useElectronNeteaseApiStatus(setStatusMsg: StatusSetter, t: TFunction) {
    const lastReportedFailureAtRef = useRef<number | null>(null);
    const restartingRef = useRef(false);

    useEffect(() => {
        const electronBridge = window.electron;
        if (!electronBridge?.getNeteaseApiStatus) {
            return;
        }

        let disposed = false;

        const reportStatus = (status: ElectronNeteaseApiStatus) => {
            if (disposed) {
                return;
            }

            if (status.status === 'running') {
                if (lastReportedFailureAtRef.current !== null) {
                    lastReportedFailureAtRef.current = null;
                }
                return;
            }

            if (status.status !== 'error') {
                return;
            }

            if (lastReportedFailureAtRef.current === status.updatedAt) {
                return;
            }

            lastReportedFailureAtRef.current = status.updatedAt;
            console.warn('[Electron] Netease API failed to start', status.error);
            setStatusMsg({
                type: 'error',
                text: t('status.neteaseApiStartupFailed') || '网易云接口启动失败，部分在线功能不可用',
                nonce: status.updatedAt,
                durationMs: 12_000,
                actionLabel: t('status.neteaseApiRestart') || '重启接口',
                onAction: () => {
                    if (restartingRef.current) return;
                    restartingRef.current = true;
                    setStatusMsg({
                        type: 'info',
                        text: t('status.neteaseApiRestarting') || '正在重启网易云接口…',
                    });
                    void restartNeteaseApi()
                        .then((nextStatus) => {
                            if (disposed) return;
                            if (nextStatus?.status === 'running') {
                                setStatusMsg({
                                    type: 'success',
                                    text: t('status.neteaseApiRestarted') || '网易云接口已恢复',
                                });
                                return;
                            }
                            lastReportedFailureAtRef.current = null;
                            reportStatus(nextStatus ?? status);
                        })
                        .catch((error) => {
                            console.warn('[Electron] Failed to restart Netease API', error);
                            if (!disposed) {
                                lastReportedFailureAtRef.current = null;
                                reportStatus(status);
                            }
                        })
                        .finally(() => {
                            restartingRef.current = false;
                        });
                },
            });
        };

        void electronBridge.getNeteaseApiStatus()
            .then(reportStatus)
            .catch((error) => {
                console.warn('[Electron] Failed to read Netease API status', error);
            });

        const unsubscribe = electronBridge.onNeteaseApiStatusChanged?.(reportStatus);

        return () => {
            disposed = true;
            unsubscribe?.();
        };
    }, [setStatusMsg, t]);
}
