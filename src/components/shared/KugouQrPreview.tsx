import React from 'react';

// src/components/shared/KugouQrPreview.tsx
// Renders the official Kugou QR image returned by login-user.kugou.com.

type KugouQrPreviewProps = {
    src: string;
    compact?: boolean;
};

const safeQrImageSrc = (value: string) => {
    const src = String(value || '').trim();
    if (!src || /["'<>]/.test(src)) return '';
    if (src.startsWith('https://') || src.startsWith('http://') || src.startsWith('data:image/')) {
        return src;
    }
    return '';
};

const KugouQrPreview: React.FC<KugouQrPreviewProps> = ({ src, compact = false }) => {
    const imageSrc = safeQrImageSrc(src);
    const size = compact ? 148 : 196;
    if (!imageSrc) {
        return (
            <div
                className="rounded-xl bg-white/5 flex items-center justify-center text-[10px] opacity-50"
                style={{ width: size, height: size }}
            >
                …
            </div>
        );
    }
    return (
        <img
            src={imageSrc}
            width={size}
            height={size}
            alt=""
            className="rounded-xl bg-white"
        />
    );
};

export default KugouQrPreview;
