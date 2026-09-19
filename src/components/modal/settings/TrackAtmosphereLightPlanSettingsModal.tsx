import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronLeft,
    Download,
    Lightbulb,
    Trash2,
    Upload,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../../types';
import type { TrackAtmosphereLightPlan, TrackAtmosphereSongMeta } from '../../../types/trackAtmosphereLightPlan';
import { useSettingsChromeDaylight } from '../../../hooks/useSettingsChromeDaylight';
import {
    clearLocalTrackAtmosphereLightPlanCache,
    removeLocalTrackAtmosphereLightPlan,
    upsertLocalTrackAtmosphereLightPlan,
} from '../../../utils/atmosphere/localTrackAtmosphereLightPlanCache';
import {
    buildTrackAtmosphereLightPlanCatalogRows,
    describeTrackAtmosphereSongMatch,
    parseTrackAtmosphereLightPlanImport,
    serializeTrackAtmosphereLightPlan,
    type TrackAtmosphereLightPlanCatalogRow,
} from '../../../utils/atmosphere/trackAtmosphereLightPlanSettingsMath';
import {
    settingsDescClass,
    settingsDescStyle,
    settingsFootnoteClass,
    settingsFootnoteStyle,
    settingsTitleClass,
    settingsTitleStyle,
} from './settingsTextStyles';

// src/components/modal/settings/TrackAtmosphereLightPlanSettingsModal.tsx
// Dedicated settings surface for curated track atmosphere / light plans.

type TrackAtmosphereLightPlanSettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    theme?: Theme;
    songMeta?: TrackAtmosphereSongMeta | null;
};

const shellTransition = { duration: 0.24, ease: 'easeOut' as const };
const panelMotion = {
    initial: { opacity: 0, scale: 0.98, y: 18 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: 18 },
};

const PaletteSwatch = ({ color, label }: { color: string; label: string }) => (
    <div className="flex items-center gap-2 min-w-0">
        <span
            className="h-7 w-7 shrink-0 rounded-full border border-white/20 shadow-inner"
            style={{ backgroundColor: color }}
            title={color}
        />
        <div className="min-w-0">
            <div className="text-[11px] opacity-60 truncate" style={{ color: 'var(--text-secondary)' }}>
                {label}
            </div>
            <div className="font-mono text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                {color}
            </div>
        </div>
    </div>
);

const TrackAtmosphereLightPlanSettingsModal: React.FC<TrackAtmosphereLightPlanSettingsModalProps> = ({
    isOpen,
    onClose,
    theme,
    songMeta = null,
}) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [revision, setRevision] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [statusText, setStatusText] = useState<string | null>(null);
    const isDaylight = useSettingsChromeDaylight();
    const borderColor = isDaylight ? 'border-zinc-300/70' : 'border-white/10';
    const subviewPanelBg = isDaylight ? 'bg-zinc-200' : 'bg-zinc-900';
    const settingsCardClass = isDaylight
        ? 'border-zinc-300/70 bg-white/55'
        : 'border-white/10 bg-white/5';
    const settingsCardInteractiveClass = isDaylight
        ? 'border-zinc-300/70 bg-white/60 hover:bg-white/80'
        : 'border-white/10 bg-white/5 hover:bg-white/10';
    const utilityGhostButtonClass = isDaylight
        ? 'border-zinc-300 bg-white/50 hover:bg-white/80'
        : 'border-white/10 bg-white/5 hover:bg-white/10';
    const overlayBackground = isDaylight ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0.5)';

    const bump = useCallback(() => setRevision((value) => value + 1), []);

    const matchInfo = useMemo(
        () => describeTrackAtmosphereSongMatch(songMeta),
        // revision refreshes local overrides after import/remove
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [songMeta, revision],
    );

    const rows = useMemo(
        () => buildTrackAtmosphereLightPlanCatalogRows(songMeta),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [songMeta, revision],
    );

    const selectedRow: TrackAtmosphereLightPlanCatalogRow | null = useMemo(() => {
        if (selectedId) {
            return rows.find((row) => row.plan.id === selectedId) ?? null;
        }
        return rows.find((row) => row.activeForSong) ?? rows[0] ?? null;
    }, [rows, selectedId]);

    const downloadPlan = (plan: TrackAtmosphereLightPlan) => {
        const blob = new Blob([serializeTrackAtmosphereLightPlan(plan)], {
            type: 'application/json;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${plan.id}.atmosphere-light-plan.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const handleImportFile = async (file: File | null) => {
        if (!file) return;
        try {
            const text = await file.text();
            const { plans, errors } = parseTrackAtmosphereLightPlanImport(text);
            if (!plans.length) {
                setStatusText(t('options.trackAtmosphereLightPlanImportFailed') || 'Import failed: invalid plan JSON.');
                return;
            }
            plans.forEach((plan) => upsertLocalTrackAtmosphereLightPlan(plan));
            bump();
            setSelectedId(plans[0].id);
            const base = t('options.trackAtmosphereLightPlanImportOk', { count: plans.length })
                || `Imported ${plans.length} plan(s)`;
            setStatusText(errors.length ? `${base} (${errors.length} skipped)` : base);
        } catch {
            setStatusText(t('options.trackAtmosphereLightPlanImportFailed') || 'Import failed: invalid plan JSON.');
        }
    };

    const handleRemoveSelected = () => {
        if (!selectedRow || selectedRow.source !== 'local') return;
        removeLocalTrackAtmosphereLightPlan(selectedRow.plan.id);
        bump();
        setSelectedId(null);
        setStatusText(t('options.trackAtmosphereLightPlanRemoved') || 'Local override removed.');
    };

    const handleClearLocals = () => {
        clearLocalTrackAtmosphereLightPlanCache();
        bump();
        setSelectedId(null);
        setStatusText(t('options.trackAtmosphereLightPlanCleared') || 'All local overrides cleared.');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
                    style={{ background: overlayBackground }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={shellTransition}
                    onClick={onClose}
                >
                    <motion.div
                        className={`mx-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-[32px] border ${borderColor} ${subviewPanelBg} shadow-[0_24px_80px_rgba(0,0,0,0.28)] relative`}
                        onClick={(event) => event.stopPropagation()}
                        {...panelMotion}
                        transition={shellTransition}
                    >
                        <div className="absolute inset-0 pointer-events-none z-0">
                            <div
                                className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-10"
                                style={{ backgroundColor: theme?.accentColor || '#3b82f6' }}
                            />
                            <div
                                className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[80px] opacity-10"
                                style={{ backgroundColor: theme?.secondaryColor || '#a855f7' }}
                            />
                        </div>

                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6 relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={`h-10 w-10 rounded-full border flex items-center justify-center transition-colors ${utilityGhostButtonClass}`}
                                    style={{ color: 'var(--text-primary)' }}
                                    data-testid="track-atmosphere-light-plan-back"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="min-w-0">
                                    <div className="text-lg sm:text-xl font-semibold truncate flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <Lightbulb size={18} className="opacity-80 shrink-0" />
                                        {t('options.trackAtmosphereLightPlanSettings') || '曲级氛围灯光'}
                                    </div>
                                    <div className={`mt-1 ${settingsDescClass}`} style={settingsDescStyle}>
                                        {t('options.trackAtmosphereLightPlanSettingsDesc')
                                            || 'Browse bundled recipes, import local overrides, and inspect the plan matched to the current song.'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${utilityGhostButtonClass}`}
                                    style={{ color: 'var(--text-primary)' }}
                                    data-testid="track-atmosphere-light-plan-import"
                                >
                                    <Upload size={14} />
                                    <span>{t('options.trackAtmosphereLightPlanImport') || '导入 JSON'}</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/json,.json"
                                    className="hidden"
                                    onChange={(event) => {
                                        void handleImportFile(event.target.files?.[0] ?? null);
                                        event.currentTarget.value = '';
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 sm:px-6 relative z-10 space-y-4">
                            <div className={`p-4 rounded-xl border ${settingsCardClass}`} data-testid="track-atmosphere-light-plan-current">
                                <div className={`${settingsTitleClass}`} style={settingsTitleStyle}>
                                    {t('options.trackAtmosphereLightPlanCurrentSong') || '当前歌曲匹配'}
                                </div>
                                <div className={`mt-2 ${settingsDescClass}`} style={settingsDescStyle}>
                                    {matchInfo.title || matchInfo.songId
                                        ? `${matchInfo.artist || '—'} · ${matchInfo.title || '—'}`
                                        : (t('options.trackAtmosphereLightPlanNoSong') || '当前没有播放歌曲')}
                                </div>
                                <div className={`mt-2 font-mono text-xs ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                    id={matchInfo.songId || '—'} · fp={matchInfo.fingerprint || '—'}
                                </div>
                                <div className="mt-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {matchInfo.resolved
                                        ? (t('options.trackAtmosphereLightPlanMatched', {
                                            id: matchInfo.resolved.plan.id,
                                            source: matchInfo.resolved.source,
                                        }) || `Matched ${matchInfo.resolved.plan.id} (${matchInfo.resolved.source})`)
                                        : (t('options.trackAtmosphereLightPlanUnmatched') || 'No curated plan matched — theme-derived intensity stays in use.')}
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className={`${settingsTitleClass}`} style={settingsTitleStyle}>
                                            {t('options.trackAtmosphereLightPlanCatalog') || '配方目录'}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleClearLocals}
                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${utilityGhostButtonClass}`}
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            <Trash2 size={12} />
                                            {t('options.trackAtmosphereLightPlanClearLocals') || '清空本地'}
                                        </button>
                                    </div>
                                    <div className="space-y-2" data-testid="track-atmosphere-light-plan-catalog">
                                        {rows.map((row) => {
                                            const active = selectedRow?.plan.id === row.plan.id;
                                            return (
                                                <button
                                                    key={`${row.source}:${row.plan.id}`}
                                                    type="button"
                                                    onClick={() => setSelectedId(row.plan.id)}
                                                    className={`w-full text-left p-3 rounded-xl border transition-colors ${active ? 'border-white/30 bg-white/10' : settingsCardInteractiveClass}`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                                                {row.plan.id}
                                                            </div>
                                                            <div className={`mt-1 ${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                                                {row.source === 'local'
                                                                    ? (t('options.trackAtmosphereLightPlanSourceLocal') || '本地覆盖')
                                                                    : (t('options.trackAtmosphereLightPlanSourceBundled') || '内置')}
                                                                {row.activeForSong
                                                                    ? ` · ${t('options.trackAtmosphereLightPlanActive') || '当前生效'}`
                                                                    : ''}
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {row.plan.atmosphere.labels.map((label) => (
                                                                    <span
                                                                        key={label}
                                                                        className="rounded-full border border-white/10 px-2 py-0.5 text-[11px]"
                                                                        style={{ color: 'var(--text-secondary)' }}
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <span
                                                                className="h-4 w-4 rounded-full border border-white/20"
                                                                style={{ backgroundColor: row.plan.lighting.palette.primary }}
                                                            />
                                                            <span
                                                                className="h-4 w-4 rounded-full border border-white/20"
                                                                style={{ backgroundColor: row.plan.lighting.palette.secondary }}
                                                            />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {!rows.length && (
                                            <div className={`p-4 rounded-xl border ${settingsCardClass} ${settingsDescClass}`} style={settingsDescStyle}>
                                                {t('options.trackAtmosphereLightPlanEmpty') || 'No plans yet. Import a JSON recipe to get started.'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`} data-testid="track-atmosphere-light-plan-detail">
                                    {selectedRow ? (
                                        <>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className={`${settingsTitleClass}`} style={settingsTitleStyle}>
                                                        {selectedRow.plan.id}
                                                    </div>
                                                    <div className={`mt-1 ${settingsDescClass}`} style={settingsDescStyle}>
                                                        mode={selectedRow.plan.lighting.mode}
                                                        {' · '}
                                                        device={selectedRow.plan.lighting.deviceHints?.protocol || 'none'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadPlan(selectedRow.plan)}
                                                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs ${utilityGhostButtonClass}`}
                                                        style={{ color: 'var(--text-primary)' }}
                                                    >
                                                        <Download size={12} />
                                                        {t('options.trackAtmosphereLightPlanExport') || '导出'}
                                                    </button>
                                                    {selectedRow.source === 'local' && (
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveSelected}
                                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs ${utilityGhostButtonClass}`}
                                                            style={{ color: 'var(--text-primary)' }}
                                                        >
                                                            <Trash2 size={12} />
                                                            {t('options.trackAtmosphereLightPlanRemove') || '删除'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <PaletteSwatch
                                                    color={selectedRow.plan.lighting.palette.primary}
                                                    label={t('options.trackAtmosphereLightPlanPrimary') || 'Primary'}
                                                />
                                                <PaletteSwatch
                                                    color={selectedRow.plan.lighting.palette.secondary}
                                                    label={t('options.trackAtmosphereLightPlanSecondary') || 'Secondary'}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                                <div>valence {selectedRow.plan.atmosphere.valence.toFixed(2)}</div>
                                                <div>energy {selectedRow.plan.atmosphere.energy.toFixed(2)}</div>
                                                <div>arousal {selectedRow.plan.atmosphere.arousal.toFixed(2)}</div>
                                                <div>warmth {selectedRow.plan.atmosphere.warmth.toFixed(2)}</div>
                                                <div>beat {selectedRow.plan.lighting.dynamics.beatSensitivity.toFixed(2)}</div>
                                                <div>brightness {selectedRow.plan.lighting.static.brightness.toFixed(2)}</div>
                                            </div>

                                            <div className={`${settingsFootnoteClass}`} style={settingsFootnoteStyle}>
                                                {t('options.trackAtmosphereLightPlanDeviceHint')
                                                    || 'Device fields are reserved for future Hue/WLED adapters and are not sent yet.'}
                                            </div>

                                            <pre
                                                className="max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] font-mono leading-relaxed"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                {serializeTrackAtmosphereLightPlan(selectedRow.plan)}
                                            </pre>
                                        </>
                                    ) : (
                                        <div className={settingsDescClass} style={settingsDescStyle}>
                                            {t('options.trackAtmosphereLightPlanEmpty') || 'No plans yet.'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {statusText && (
                                <div className={`text-xs ${settingsFootnoteClass}`} style={settingsFootnoteStyle} data-testid="track-atmosphere-light-plan-status">
                                    {statusText}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TrackAtmosphereLightPlanSettingsModal;
