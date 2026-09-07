import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import QuickEffectPicker from '../QuickEffectPicker';

// src/components/panelTab/controls/ModeStepperRow.tsx
// 「‹ glyph current-mode ›」: arrows step neighbors, the name opens the full list.

const STEP_ENTER_OFFSET_PX = 12;
const STEP_TRANSITION = { duration: 0.18, ease: 'easeOut' } as const;

interface ModeStepperRowProps<Value extends string> {
    value: Value;
    options: { value: Value; label: string }[];
    onSelect: (value: Value) => void;
    onStep: (direction: -1 | 1) => void;
    renderGlyph: (value: Value) => React.ReactNode;
    ariaLabel: string;
    moreLabel: string;
    onOpenMore: () => void;
    isDaylight: boolean;
    primaryColor: string;
    testIdPrefix?: string;
}

const ModeStepperRow = <Value extends string>({
    value,
    options,
    onSelect,
    onStep,
    renderGlyph,
    ariaLabel,
    moreLabel,
    onOpenMore,
    isDaylight,
    primaryColor,
    testIdPrefix,
}: ModeStepperRowProps<Value>) => {
    const hoverBg = isDaylight ? 'hover:bg-black/[0.06]' : 'hover:bg-white/[0.08]';
    const canStep = options.length > 1;
    const prefersReducedMotion = useReducedMotion();
    const [stepDirection, setStepDirection] = useState<-1 | 0 | 1>(0);
    const enterOffset = prefersReducedMotion ? 0 : stepDirection * STEP_ENTER_OFFSET_PX;

    const handleSelect = (nextValue: Value) => {
        setStepDirection(0);
        onSelect(nextValue);
    };

    const renderStepButton = (direction: -1 | 1) => (
        <motion.button
            type="button"
            onClick={() => {
                setStepDirection(direction);
                onStep(direction);
            }}
            disabled={!canStep}
            whileTap={canStep && !prefersReducedMotion ? { scale: 0.82, x: direction * 2 } : undefined}
            transition={STEP_TRANSITION}
            className={`flex h-8 w-6 shrink-0 items-center justify-center rounded-lg opacity-40 transition-colors ${hoverBg} hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-20`}
            aria-label={`${ariaLabel} ${direction === -1 ? '−' : '+'}`}
            data-testid={testIdPrefix ? `${testIdPrefix}-${direction === -1 ? 'prev' : 'next'}` : undefined}
        >
            {direction === -1 ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </motion.button>
    );

    return (
        <div className="flex items-center gap-0.5">
            {renderStepButton(-1)}

            <div className="min-w-0 flex-1">
                <QuickEffectPicker<Value>
                    value={value}
                    options={options}
                    onChange={handleSelect}
                    isDaylight={isDaylight}
                    primaryColor={primaryColor}
                    ariaLabel={ariaLabel}
                    testIdPrefix={testIdPrefix}
                    renderOptionPrefix={renderGlyph}
                    footerAction={{ label: moreLabel, onSelect: onOpenMore }}
                    renderTrigger={({ isOpen, toggle, selectedLabel }) => (
                        <button
                            type="button"
                            onClick={toggle}
                            className={`flex h-8 w-full items-center gap-2 rounded-lg px-2 transition-colors ${hoverBg}`}
                            title={`${ariaLabel}: ${selectedLabel}`}
                            aria-label={ariaLabel}
                            aria-haspopup="listbox"
                            aria-expanded={isOpen}
                            data-testid={testIdPrefix ? `${testIdPrefix}-trigger` : undefined}
                        >
                            <motion.span
                                key={value}
                                initial={{ opacity: 0, x: enterOffset }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={STEP_TRANSITION}
                                className="flex min-w-0 items-center gap-2"
                            >
                                <span className="flex shrink-0 items-center opacity-55">
                                    {renderGlyph(value)}
                                </span>
                                <span
                                    className="truncate text-[11px] font-semibold tracking-wide"
                                    style={isOpen ? { color: primaryColor } : undefined}
                                >
                                    {selectedLabel}
                                </span>
                            </motion.span>
                        </button>
                    )}
                />
            </div>

            {renderStepButton(1)}
        </div>
    );
};

export default ModeStepperRow;
