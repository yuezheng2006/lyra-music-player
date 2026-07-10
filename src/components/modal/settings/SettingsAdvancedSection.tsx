import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { settingsDescStyle, settingsTitleStyle } from './settingsTextStyles';

// Collapsible advanced block so default settings stay short.

type SettingsAdvancedSectionProps = {
    children: React.ReactNode;
    defaultOpen?: boolean;
    title?: string;
};

const SettingsAdvancedSection: React.FC<SettingsAdvancedSectionProps> = ({
    children,
    defaultOpen = false,
    title,
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(defaultOpen);
    const label = title || t('options.advancedSettings') || '高级选项';

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                aria-expanded={open}
            >
                <span className="text-xs font-semibold tracking-wide" style={settingsTitleStyle}>
                    {label}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px]" style={settingsDescStyle}>
                    {open
                        ? (t('options.advancedSettingsHide') || '收起')
                        : (t('options.advancedSettingsShow') || '展开')}
                    <ChevronDown
                        size={14}
                        className={`transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                </span>
            </button>
            {open ? <div className="space-y-4">{children}</div> : null}
        </div>
    );
};

export default SettingsAdvancedSection;
