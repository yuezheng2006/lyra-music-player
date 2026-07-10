import React from 'react';
import { X } from 'lucide-react';

// src/components/shared/SearchClearButton.tsx
// Shared clear control for search fields across home, overlay, and match modals.

type SearchClearButtonProps = {
    visible: boolean;
    onClear: () => void;
    label: string;
    className?: string;
    iconSize?: number;
};

export const SearchClearButton: React.FC<SearchClearButtonProps> = ({
    visible,
    onClear,
    label,
    className = '',
    iconSize = 14,
}) => {
    if (!visible) return null;

    return (
        <button
            type="button"
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClear();
            }}
            className={`inline-flex items-center justify-center rounded-full p-1 opacity-45 transition-opacity hover:opacity-90 touch-manipulation ${className}`.trim()}
            aria-label={label}
            title={label}
        >
            <X size={iconSize} />
        </button>
    );
};

export default SearchClearButton;
