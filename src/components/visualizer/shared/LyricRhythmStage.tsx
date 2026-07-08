import React from 'react';
import { motion, type MotionValue } from 'framer-motion';
import { useLyricRhythmMotion } from '../../../hooks/visualizer/useLyricRhythmMotion';

// src/components/visualizer/shared/LyricRhythmStage.tsx
// Wraps lyric content with the shared rhythm scale/glow used by the 3D background.

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
    glowColor,
    className = '',
    children,
}) => {
    const { scale, glowShadow } = useLyricRhythmMotion({
        audioPower,
        beatPulse,
        cameraPunch,
        cinemaScale,
        atmosphereEnergy,
        scaleMultiplier,
        glowColor,
    });

    return (
        <motion.div
            className={`${className} relative isolate z-[1]`}
            style={{
                scale,
                filter: glowShadow,
            }}
        >
            {children}
        </motion.div>
    );
};

export default LyricRhythmStage;
