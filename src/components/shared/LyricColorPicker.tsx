import React, { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

// src/components/shared/LyricColorPicker.tsx
// Free lyric body-color control for Controls / floating dock (react-colorful).

type LyricColorPickerProps = {
    color: string;
    onChange: (color: string) => void;
    isDaylight?: boolean;
    compact?: boolean;
    className?: string;
};

const normalizeIncoming = (value: string): string => {
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
        return `#${trimmed.slice(1).split('').map(c => `${c}${c}`).join('')}`.toLowerCase();
    }
    return '#f4f4f5';
};

const LyricColorPicker: React.FC<LyricColorPickerProps> = ({
    color,
    onChange,
    isDaylight = false,
    compact = false,
    className = '',
}) => {
    const [localColor, setLocalColor] = useState(() => normalizeIncoming(color));
    const [hexDraft, setHexDraft] = useState(() => normalizeIncoming(color).slice(1));
    const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestColorRef = useRef(normalizeIncoming(color));

    useEffect(() => {
        const next = normalizeIncoming(color);
        setLocalColor(next);
        setHexDraft(next.slice(1));
        latestColorRef.current = next;
    }, [color]);

    useEffect(() => () => {
        if (throttleTimeoutRef.current) {
            clearTimeout(throttleTimeoutRef.current);
        }
    }, []);

    const emitThrottled = (next: string) => {
        latestColorRef.current = next;
        if (!throttleTimeoutRef.current) {
            throttleTimeoutRef.current = setTimeout(() => {
                throttleTimeoutRef.current = null;
                onChange(latestColorRef.current);
            }, 33);
        }
    };

    const emitInstant = (next: string) => {
        if (throttleTimeoutRef.current) {
            clearTimeout(throttleTimeoutRef.current);
            throttleTimeoutRef.current = null;
        }
        latestColorRef.current = next;
        onChange(next);
    };

    const handlePickerChange = (next: string) => {
        const normalized = normalizeIncoming(next);
        setLocalColor(normalized);
        setHexDraft(normalized.slice(1));
        emitThrottled(normalized);
    };

    const commitHexDraft = () => {
        const candidate = `#${hexDraft.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)}`;
        if (!/^#[0-9a-fA-F]{6}$/.test(candidate)) {
            setHexDraft(localColor.slice(1));
            return;
        }
        const normalized = candidate.toLowerCase();
        setLocalColor(normalized);
        setHexDraft(normalized.slice(1));
        emitInstant(normalized);
    };

    const wellClass = isDaylight ? 'bg-black/[0.04]' : 'bg-white/[0.06]';
    const textClass = isDaylight ? 'text-stone-800' : 'text-white/90';
    const borderClass = isDaylight ? 'border-black/10' : 'border-white/15';

    return (
        <div
            className={`space-y-2 ${className}`.trim()}
            data-testid="lyric-color-picker"
        >
            <HexColorPicker
                color={localColor}
                onChange={handlePickerChange}
                style={{ width: '100%', height: compact ? 140 : 180 }}
            />
            <div className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${wellClass} ${borderClass}`}>
                <span
                    className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: localColor }}
                    aria-hidden
                />
                <span className={`text-[11px] font-semibold opacity-50 ${textClass}`}>#</span>
                <input
                    type="text"
                    value={hexDraft}
                    onChange={(event) => setHexDraft(event.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
                    onBlur={commitHexDraft}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.currentTarget.blur();
                        }
                    }}
                    spellCheck={false}
                    aria-label="Lyric color hex"
                    data-testid="lyric-color-picker-hex"
                    className={`min-w-0 flex-1 bg-transparent font-mono text-[12px] uppercase outline-none ${textClass}`}
                />
                <input
                    type="color"
                    value={localColor}
                    onChange={(event) => handlePickerChange(event.target.value)}
                    aria-label="Lyric color native picker"
                    data-testid="lyric-color-picker-native"
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
            </div>
        </div>
    );
};

export default LyricColorPicker;
