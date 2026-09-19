import * as THREE from 'three';
import type { Interactive3dSceneTuning } from '../../../../types';
import type { GeometricQualityTier } from '../geometricQuality';
import {
    CoverColorMixTween,
    DEFAULT_COVER_COLOR_MIX_MS,
    EMILY_COVER_COLOR_MIX_MS,
} from './coverColorMixTween';
import { CoverNumericTween } from './coverNumericTween';
import { buildCoverEdgeAndDepthFromSource } from './buildCoverEdgeAndDepth';
import {
    resolveCoverSwapDepthHold,
    shouldHoldCoverThroughLoadFailure,
    shouldHoldCoverThroughNullUrl,
    shouldShowCoverLoadMist,
} from './coverParticleDisplayTuning';
import type { CoverParticleBurstSmoother } from './coverParticleBurstSmoother';
import type { CoverParticleUniforms } from './coverParticleMaterials';
import {
    coverParticleTextureSizeForQualityTier,
    drawCoverToSquareCanvas,
} from './prepareCoverParticleTexture';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';
import { fetchCoverViaProxy } from '../../../../utils/fetchCoverViaProxy';

// src/components/visualizer/geometric/webgl/coverParticleCoverLoader.ts
// Cover artwork fetch / square-canvas bake / dissolve handoff for cover particles.

export interface CoverParticleCoverLoaderHost {
    container: HTMLElement | null;
    uniforms: CoverParticleUniforms;
    textureLoader: THREE.TextureLoader;
    prevCoverTexture: THREE.Texture;
    colorMixTween: CoverColorMixTween;
    loadingTween: CoverNumericTween;
    burstSmoother: CoverParticleBurstSmoother;
    getCoverTexture: () => THREE.Texture | null;
    setCoverTexture: (texture: THREE.Texture | null) => void;
    getEdgeTexture: () => THREE.Texture | null;
    setEdgeTexture: (texture: THREE.Texture | null) => void;
    getTuning: () => Interactive3dSceneTuning | undefined;
    getQualityTier: () => GeometricQualityTier;
    setCoverDepthState: (depthTo: number, aiTo: number, durationMs: number) => void;
    ensureParticleAlphaVisible: () => void;
    renderFrame: () => void;
}

/** Manages cover URL loads, loading mist, and prev-cover dissolve prep. */
export class CoverParticleCoverLoader {
    private loadedCoverUrl: string | null = null;

    private attemptedCoverUrl: string | null = null;

    private coverLoadToken = 0;

    private coverObjectUrl: string | null = null;

    private loadingShownAt = 0;

    private loadingHideTimer: number | null = null;

    constructor(private readonly host: CoverParticleCoverLoaderHost) {}

    getLoadedCoverUrl() {
        return this.loadedCoverUrl;
    }

    invalidate() {
        this.coverLoadToken += 1;
        this.cancelLoadingTimer();
        this.revokeCoverObjectUrl();
    }

    dispose() {
        this.invalidate();
    }

    load(url: string | null) {
        if (url === this.loadedCoverUrl) return;
        if (url && url === this.attemptedCoverUrl) return;
        this.attemptedCoverUrl = url;
        const loadToken = ++this.coverLoadToken;
        const coverTexture = this.host.getCoverTexture();
        const hasActiveCover = (this.host.uniforms.uHasCover.value ?? 0) > 0.5 && !!coverTexture;
        this.host.container?.setAttribute('data-cover-url', url ?? '');
        this.host.container?.removeAttribute('data-cover-load-error');

        if (!url) {
            if (shouldHoldCoverThroughNullUrl(hasActiveCover)) return;
            this.loadedCoverUrl = null;
            this.host.uniforms.uHasCover.value = 0;
            this.host.setCoverDepthState(0, 0, 1);
            this.hideLoading();
            this.revokeCoverObjectUrl();
            this.host.container?.removeAttribute('data-loaded-cover-url');
            this.host.container?.removeAttribute('data-cover-depth-ready');
            return;
        }

        if (shouldShowCoverLoadMist(hasActiveCover, true)) {
            this.showLoading();
        } else if ((this.host.uniforms.uLoading.value || 0) > 0.001) {
            this.host.loadingTween.cancel();
            this.host.uniforms.uLoading.value = 0;
            this.host.container?.removeAttribute('data-cover-loading');
        }

        this.host.textureLoader.setCrossOrigin('anonymous');
        void this.resolveCoverTextureUrl(url).then(({ textureUrl, objectUrl }) => {
            if (loadToken !== this.coverLoadToken) {
                if (objectUrl) URL.revokeObjectURL(textureUrl);
                return;
            }
            if (objectUrl) {
                this.revokeCoverObjectUrl();
                this.coverObjectUrl = textureUrl;
            }
            this.host.textureLoader.load(
                textureUrl,
                (texture) => this.onTextureLoaded({
                    texture,
                    coverUrl: url,
                    textureUrl,
                    loadToken,
                    objectUrl,
                    hasActiveCover,
                }),
                undefined,
                () => {
                    if (loadToken !== this.coverLoadToken) return;
                    this.failLoad('texture-load-failed', hasActiveCover);
                },
            );
        }).catch(() => {
            if (loadToken !== this.coverLoadToken) return;
            this.failLoad('proxy-fetch-failed', hasActiveCover);
        });
    }

    private onTextureLoaded(input: {
        texture: THREE.Texture;
        coverUrl: string;
        textureUrl: string;
        loadToken: number;
        objectUrl: true | null;
        hasActiveCover: boolean;
    }) {
        const { texture, coverUrl: url, textureUrl, loadToken, objectUrl, hasActiveCover } = input;
        if (loadToken !== this.coverLoadToken) {
            texture.dispose();
            if (objectUrl) URL.revokeObjectURL(textureUrl);
            return;
        }
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const current = this.host.getCoverTexture();
        if (current?.image) {
            this.copyCoverImageToPrevious(current.image as CanvasImageSource);
            const mixMs = normalizeInteractive3dVisualPreset(this.host.getTuning()?.visualPreset) === 'emily'
                ? EMILY_COVER_COLOR_MIX_MS
                : DEFAULT_COVER_COLOR_MIX_MS;
            this.host.uniforms.uDissolveLive.value = 1;
            this.host.uniforms.uDissolve.value = 0;
            this.host.burstSmoother.trigger(0.22);
            this.host.colorMixTween.start((mix) => {
                this.host.uniforms.uColorMixT.value = mix;
                this.host.uniforms.uDissolve.value = mix;
                if (mix >= 1) this.host.uniforms.uDissolveLive.value = 0;
            }, mixMs);
        } else {
            this.host.uniforms.uColorMixT.value = 1;
            this.host.uniforms.uDissolve.value = 1;
            this.host.uniforms.uDissolveLive.value = 0;
        }

        let coverCanvas: HTMLCanvasElement | null = null;
        try {
            coverCanvas = drawCoverToSquareCanvas(
                texture.image as CanvasImageSource,
                coverParticleTextureSizeForQualityTier(this.host.getQualityTier()),
            );
        } catch {
            coverCanvas = null;
        }
        texture.dispose();
        if (!coverCanvas) {
            this.failLoad('canvas-unreadable', hasActiveCover);
            return;
        }

        current?.dispose();
        const next = new THREE.Texture(coverCanvas);
        next.minFilter = THREE.LinearFilter;
        next.magFilter = THREE.LinearFilter;
        next.wrapS = THREE.ClampToEdgeWrapping;
        next.wrapT = THREE.ClampToEdgeWrapping;
        next.needsUpdate = true;
        this.host.setCoverTexture(next);
        this.host.uniforms.uCoverTex.value = next;
        this.host.uniforms.uHasCover.value = 1;
        this.loadedCoverUrl = url;
        this.host.container?.setAttribute('data-loaded-cover-url', url);

        const heldDepth = resolveCoverSwapDepthHold(this.host.uniforms.uHasDepth.value || 0);
        const heldAi = hasActiveCover
            ? Math.max(this.host.uniforms.uAiBoost.value || 0, 0.35)
            : 0.20;
        this.host.setCoverDepthState(heldDepth, heldAi, hasActiveCover ? 180 : 120);
        try {
            this.applyCoverEdgeFromImage(coverCanvas);
        } catch {
            if (!shouldHoldCoverThroughLoadFailure(hasActiveCover)) {
                this.host.setCoverDepthState(0, 0, 1);
            }
        }
        this.host.ensureParticleAlphaVisible();
        this.hideLoading();
        this.host.renderFrame();
    }

    private failLoad(error: string, hasActiveCover: boolean) {
        this.host.container?.setAttribute('data-cover-load-error', error);
        if (!shouldHoldCoverThroughLoadFailure(hasActiveCover)) {
            this.loadedCoverUrl = null;
            this.host.uniforms.uHasCover.value = 0;
            this.host.setCoverDepthState(0, 0, 1);
        }
        this.hideLoading();
    }

    private async resolveCoverTextureUrl(url: string) {
        if (url.startsWith('blob:') || url.startsWith('data:')) {
            return { textureUrl: url, objectUrl: null };
        }
        const buildObjectUrl = async (response: Response) => {
            if (!response.ok) throw new Error(`cover fetch failed: ${response.status}`);
            const blob = await response.blob();
            if (!blob.size) throw new Error('cover fetch returned empty body');
            return { textureUrl: URL.createObjectURL(blob), objectUrl: true as const };
        };
        try {
            return await buildObjectUrl(await fetch(url, { mode: 'cors', credentials: 'omit' }));
        } catch {
            try {
                return await buildObjectUrl(await fetchCoverViaProxy(url));
            } catch {
                throw new Error(`cover proxy fetch failed for ${url}`);
            }
        }
    }

    private showLoading() {
        this.loadingShownAt = performance.now();
        this.cancelLoadingTimer();
        this.host.container?.setAttribute('data-cover-loading', 'true');
        const current = this.host.uniforms.uLoading.value || 0;
        this.host.loadingTween.start(current, Math.max(current, 0.56), current > 0.04 ? 86 : 118, (loading) => {
            this.host.uniforms.uLoading.value = loading;
        });
    }

    private hideLoading() {
        this.cancelLoadingTimer();
        const elapsed = this.loadingShownAt ? performance.now() - this.loadingShownAt : 999;
        const wait = Math.max(0, 72 - elapsed);
        this.loadingHideTimer = window.setTimeout(() => {
            this.loadingHideTimer = null;
            const current = this.host.uniforms.uLoading.value || 0;
            if (current <= 0.015) {
                this.host.loadingTween.cancel();
                this.host.uniforms.uLoading.value = 0;
                this.host.container?.removeAttribute('data-cover-loading');
                return;
            }
            this.host.loadingTween.start(current, 0, current > 0.38 ? 126 : 96, (loading) => {
                this.host.uniforms.uLoading.value = loading;
                if (loading <= 0.015) this.host.container?.removeAttribute('data-cover-loading');
            });
        }, wait);
    }

    private cancelLoadingTimer() {
        if (!this.loadingHideTimer) return;
        window.clearTimeout(this.loadingHideTimer);
        this.loadingHideTimer = null;
    }

    private revokeCoverObjectUrl() {
        if (!this.coverObjectUrl) return;
        URL.revokeObjectURL(this.coverObjectUrl);
        this.coverObjectUrl = null;
    }

    private copyCoverImageToPrevious(image: CanvasImageSource) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, 256, 256);
        this.host.prevCoverTexture.image = canvas;
        this.host.prevCoverTexture.needsUpdate = true;
        this.host.uniforms.uPrevCoverTex.value = this.host.prevCoverTexture;
    }

    private applyCoverEdgeFromImage(image: CanvasImageSource) {
        const edgeCanvas = buildCoverEdgeAndDepthFromSource(image);
        if (!edgeCanvas) {
            this.host.uniforms.uHasDepth.value = 0;
            return;
        }
        let edgeTexture = this.host.getEdgeTexture();
        if (!edgeTexture) {
            edgeTexture = new THREE.Texture(edgeCanvas);
            edgeTexture.minFilter = THREE.LinearFilter;
            edgeTexture.magFilter = THREE.LinearFilter;
            this.host.setEdgeTexture(edgeTexture);
        } else {
            edgeTexture.image = edgeCanvas;
        }
        edgeTexture.needsUpdate = true;
        this.host.uniforms.uEdgeTex.value = edgeTexture;
        this.host.setCoverDepthState(1, 0.55, 260);
        this.host.uniforms.uDepth.value = 1.30;
        this.host.container?.setAttribute('data-cover-depth-ready', 'true');
    }
}
