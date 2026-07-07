import type { Interactive3dSceneTuning } from '../../../../types';
import type {
    PlaylistShelfCameraMode,
    PlaylistShelfMode,
    ShelfCardTransform,
    ShelfLayoutProfile,
} from './shelfTypes';

// src/components/visualizer/geometric/shelf/shelfLayout.ts
// Pure layout math for sidebar/stage playlist shelf card placement.

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** 根据镜头模式与侧栏模式解析默认 Y 轴偏角（度）。 */
export const resolveDefaultShelfAngleY = (
    mode: PlaylistShelfMode,
    cameraMode: PlaylistShelfCameraMode,
): number => {
    if (mode !== 'sidebar') return 0;
    return cameraMode === 'static' ? -15 : 0;
};

/** 从 3D 场景 tuning 解析歌单架布局参数。 */
export const resolveShelfLayoutProfile = (
    tuning: Pick<
        Interactive3dSceneTuning,
        'shelfMode' | 'shelfPresence' | 'shelfCameraMode'
    >,
): ShelfLayoutProfile => {
    const mode = tuning.shelfMode ?? 'off';
    const cameraMode = tuning.shelfCameraMode ?? 'dynamic';

    return {
        mode,
        presence: tuning.shelfPresence ?? 'auto',
        cameraMode,
        size: 1,
        offsetX: mode === 'sidebar' ? 0.62 : 0,
        offsetY: 0,
        offsetZ: mode === 'sidebar' ? -0.08 : 0.12,
        angleY: resolveDefaultShelfAngleY(mode, cameraMode),
        opacity: 0.92,
        bgOpacity: 0.72,
    };
};

/** 计算相邻卡片间距，随 size 缩放。 */
export const computeShelfCardSpacing = (size: number): number => clamp(0.11 * size, 0.08, 0.16);

/** 计算单张卡片在 3D 空间中的变换（中心索引对齐视口中心行）。 */
export const computeShelfCardTransform = (params: {
    mode: PlaylistShelfMode;
    profile: ShelfLayoutProfile;
    index: number;
    selectedIndex: number;
    total: number;
}): ShelfCardTransform => {
    const { mode, profile, index, selectedIndex, total } = params;
    if (total <= 0) {
        return { x: 0, y: 0, z: 0, rotateY: 0, scale: 1, opacity: 0, isCenter: false };
    }

    const clampedSelected = clamp(selectedIndex, 0, total - 1);
    const relative = index - clampedSelected;
    const spacing = computeShelfCardSpacing(profile.size);
    const isCenter = relative === 0;
    const distance = Math.abs(relative);
    const falloff = clamp(1 - distance * 0.18, 0.34, 1);

    const baseX = profile.offsetX;
    const baseY = profile.offsetY - relative * spacing;
    const baseZ = profile.offsetZ - Math.abs(relative) * 0.018 + (isCenter ? 0.035 : 0);
    const rotateY = profile.angleY + relative * (mode === 'stage' ? -4 : -2.5);
    const scale = (mode === 'stage' ? 0.92 : 0.84) * profile.size * (isCenter ? 1.08 : 0.92 - distance * 0.04);
    const opacity = profile.opacity * falloff * (isCenter ? 1 : 0.82);

    return {
        x: baseX,
        y: baseY,
        z: baseZ,
        rotateY,
        scale,
        opacity,
        isCenter,
    };
};

/** 判断当前 tuning 是否应挂载歌单架 stage。 */
export const shouldRenderPlaylistShelf = (
    tuning?: Pick<Interactive3dSceneTuning, 'shelfMode'>,
): boolean => (tuning?.shelfMode ?? 'off') !== 'off';

/** 滚轮步进后得到新的选中索引（循环）。 */
export const advanceShelfSelection = (
    currentIndex: number,
    delta: number,
    total: number,
): number => {
    if (total <= 0) return 0;
    const next = currentIndex + (delta > 0 ? 1 : delta < 0 ? -1 : 0);
    if (next < 0) return total - 1;
    if (next >= total) return 0;
    return next;
};
