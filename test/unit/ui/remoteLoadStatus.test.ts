import { describe, expect, it } from 'vitest';
import {
    resolveRemoteLoadMessageKey,
    resolveRemoteLoadStatus,
} from '../../../src/utils/ui/remoteLoadStatus';

describe('resolveRemoteLoadStatus', () => {
    it('returns loading while unsettled with no items', () => {
        expect(resolveRemoteLoadStatus({
            loading: true,
            settled: false,
            itemCount: 0,
        })).toBe('loading');
    });

    it('keeps ready content while refreshing', () => {
        expect(resolveRemoteLoadStatus({
            loading: true,
            settled: false,
            itemCount: 3,
            keepPreviousOnRefresh: true,
        })).toBe('ready');
    });

    it('treats error with zero items as error, not empty', () => {
        expect(resolveRemoteLoadStatus({
            loading: false,
            settled: true,
            itemCount: 0,
            error: 'timeout',
        })).toBe('error');
    });

    it('treats settled zero items without error as empty', () => {
        expect(resolveRemoteLoadStatus({
            loading: false,
            settled: true,
            itemCount: 0,
            error: null,
        })).toBe('empty');
    });

    it('prefers auth when needsAuth and empty', () => {
        expect(resolveRemoteLoadStatus({
            loading: false,
            settled: true,
            itemCount: 0,
            needsAuth: true,
            error: 'need-login',
        })).toBe('auth');
    });
});

describe('resolveRemoteLoadMessageKey', () => {
    it('maps error codes to i18n keys', () => {
        expect(resolveRemoteLoadMessageKey('error', 'timeout')).toBe('remoteLoad.timeout');
        expect(resolveRemoteLoadMessageKey('error', 'network')).toBe('remoteLoad.network');
        expect(resolveRemoteLoadMessageKey('empty')).toBe('remoteLoad.empty');
        expect(resolveRemoteLoadMessageKey('auth')).toBe('remoteLoad.auth');
    });
});
