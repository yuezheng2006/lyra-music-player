import type { Theme } from '../../../types';
import { mixColors } from '../colorMix';

// src/components/visualizer/cappella/cappellaBubbleColors.ts
// Resolves chat-bubble fill/border/text colors with readable contrast on both sides.

export type CappellaBubbleColors = {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
};

/**
 * Right = self (accent wash + dark ink).
 * Left = others (light frosted panel + dark ink) so pale lyric primaries cannot wash out.
 */
export const getCappellaBubbleColors = (
    side: 'left' | 'right',
    theme: Theme,
): CappellaBubbleColors => {
    const darkInk = mixColors(theme.backgroundColor, '#12141a', 0.22, 1);

    if (side === 'right') {
        return {
            backgroundColor: mixColors(theme.accentColor, theme.primaryColor, 0.16, 0.96),
            borderColor: mixColors(theme.accentColor, theme.primaryColor, 0.32, 0.34),
            textColor: darkInk,
        };
    }

    return {
        backgroundColor: mixColors('#edf1f7', theme.secondaryColor, 0.22, 0.96),
        borderColor: mixColors('#cfd6e2', theme.secondaryColor, 0.3, 0.42),
        textColor: darkInk,
    };
};
