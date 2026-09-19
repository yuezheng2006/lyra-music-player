import React from 'react';
import { motion, type MotionValue } from 'framer-motion';
import { useLyricRhythmMotion } from '../../../hooks/visualizer/useLyricRhythmMotion';

// src/components/visualizer/shared/LyricRhythmStage.tsx
// Folia: lyrics are a sibling compositor to the background. Scale via transform only —
// never animate CSS `filter` on this tree (Chrome re-rasters every glyph + karaoke wipe).

interface LyricRhythmStageProps {
    audioPower: MotionValue<number>;
    beatPulse?: MotionValue<number>;
    cameraPunch?: MotionValue<number>;
    cinemaScale?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    scaleMultiplier?: number;
    glowColor?: string | null;
    className?: string;
    children: React.ReactNode;
}

const LyricRhythmStage: React.FC<LyricRhythmStageProps> = ({
    audioPower,
    beatPulse,
    cameraPunch,
    cinemaScale,
    atmosphereEnergy,
    scaleMultiplier,
    className = '',
    children,
}) => {
    const { scale } = useLyricRhythmMotion({
        audioPower,
        beatPulse,
        cameraPunch,
        cinemaScale,
        atmosphereEnergy,
        scaleMultiplier,
    });

    return (
        <motion.div
            className={`${className} relative isolate z-[1]`}
            style={{ scale }}
        >
            {children}
        </motion.div>
    );
};

export default LyricRhythmStage;
