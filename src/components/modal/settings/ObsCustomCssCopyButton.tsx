import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buildObsCustomCss } from '../../../utils/obs/buildObsCustomCss';

// src/components/modal/settings/ObsCustomCssCopyButton.tsx
// Copy OBS Custom CSS that carries uploaded visualizer assets into the overlay.

type ObsCustomCssCopyButtonProps = {
    copyText: (text: string) => Promise<void>;
};

const ObsCustomCssCopyButton: React.FC<ObsCustomCssCopyButtonProps> = ({ copyText }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);

    const handleCopy = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const result = await buildObsCustomCss();
            await copyText(result.css);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            onClick={() => { void handleCopy(); }}
            disabled={busy}
            className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors disabled:opacity-40 flex items-center gap-2"
            style={{ color: copied ? '#86efac' : 'var(--text-primary)' }}
        >
            {copied ? <Check size={14} /> : null}
            {copied
                ? (t('options.stageAddressCopied') || 'Copied')
                : (t('options.copyObsCustomCss') || 'Copy Custom CSS')}
        </button>
    );
};

export default ObsCustomCssCopyButton;
