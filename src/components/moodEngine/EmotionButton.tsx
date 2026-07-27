// src/components/moodEngine/EmotionButton.tsx
// Emotion Button Component - displays current emotion and opens selector
// 情绪按钮组件

import React, { useEffect, useRef, useState } from 'react';
import { useMagneticPull } from '../../hooks/useMagneticPull';
import { useScrambleText } from '../../hooks/useScrambleText';
import { useMagneticPullStore } from '../../stores/useMagneticPullStore';
import { useMoodEngineStore } from '../../stores/useMoodEngineStore';
import { getEmotionDisplayName } from '../../types/moodEngine';
import { getAtmospherePresentationBeatPulse } from '../../utils/atmosphere/atmospherePresentationBus';
import './EmotionSelector.css';

interface EmotionButtonProps {
  /** 是否精简模式（仅图标） */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

const COMPACT_LABEL_HOLD_MS = 220;
const CORRECTION_NOTICE_HOLD_MS = 3200;

/**
 * 情绪按钮组件
 * Shows current song emotion and allows user to correct it
 */
export const EmotionButton: React.FC<EmotionButtonProps> = ({
  compact = false,
  className = '',
}) => {
  const currentEmotion = useMoodEngineStore((s) => s.currentEmotion);
  const loading = useMoodEngineStore((s) => s.loading);
  const openSelector = useMoodEngineStore((s) => s.openSelector);
  const correctionNotice = useMoodEngineStore((s) => s.correctionNotice);
  const correctionPulseAt = useMoodEngineStore((s) => s.correctionPulseAt);
  const clearCorrectionNotice = useMoodEngineStore((s) => s.clearCorrectionNotice);
  const magneticEnabled = useMagneticPullStore((s) => s.enabled);
  const scrambleEnabled = useMagneticPullStore((s) => s.scrambleEnabled);
  const beatPulseEnabled = useMagneticPullStore((s) => s.beatPulseEnabled);

  const hostRef = useRef<HTMLButtonElement>(null);
  const faceRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [compactLabelOpen, setCompactLabelOpen] = useState(false);
  const [correctionFlash, setCorrectionFlash] = useState(false);
  const prevEmotionRef = useRef<string | null>(null);
  const compactCloseTimerRef = useRef(0);
  const noticeTimerRef = useRef(0);

  const emotionId = currentEmotion?.emotion ?? null;
  const emotionName = emotionId ? getEmotionDisplayName(emotionId) : '';
  const showLabel = !compact || compactLabelOpen;
  const scrambleActive = Boolean(
    scrambleEnabled && !loading && emotionId && showLabel && emotionName,
  );

  useEffect(() => () => {
    if (compactCloseTimerRef.current) {
      window.clearTimeout(compactCloseTimerRef.current);
    }
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
  }, []);

  // Surface store notice + flash after user picks an emotion in the selector.
  useEffect(() => {
    if (!correctionPulseAt && !correctionNotice) return undefined;
    setCorrectionFlash(true);
    if (compact) setCompactLabelOpen(true);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      noticeTimerRef.current = 0;
      setCorrectionFlash(false);
      clearCorrectionNotice();
      if (compact) setCompactLabelOpen(false);
    }, CORRECTION_NOTICE_HOLD_MS);
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = 0;
      }
    };
  }, [clearCorrectionNotice, compact, correctionNotice, correctionPulseAt]);

  useMagneticPull(hostRef, faceRef, {
    strength: 0.2,
    maxPull: 10,
    enabled: magneticEnabled && !loading,
  });

  useScrambleText({
    text: emotionName,
    playKey: emotionId ?? '',
    targetRef: labelRef,
    enabled: scrambleActive,
    onComplete: () => {
      if (!compact) return;
      if (compactCloseTimerRef.current) {
        window.clearTimeout(compactCloseTimerRef.current);
      }
      compactCloseTimerRef.current = window.setTimeout(() => {
        compactCloseTimerRef.current = 0;
        setCompactLabelOpen(false);
      }, COMPACT_LABEL_HOLD_MS);
    },
  });

  // Compact: briefly expand + scramble when emotion id changes.
  useEffect(() => {
    if (!compact || !emotionId || !scrambleEnabled || loading) {
      prevEmotionRef.current = emotionId;
      return;
    }
    if (prevEmotionRef.current === null) {
      prevEmotionRef.current = emotionId;
      return;
    }
    if (prevEmotionRef.current === emotionId) return;
    prevEmotionRef.current = emotionId;
    setCompactLabelOpen(true);
  }, [compact, emotionId, loading, scrambleEnabled]);

  // Beat pulse → CSS var (no React state per frame); idle-stop when pulse ~0.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !beatPulseEnabled || loading) {
      if (host) {
        host.style.removeProperty('--emotion-beat');
        host.classList.remove('emotion-button--beat');
      }
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      host.style.removeProperty('--emotion-beat');
      host.classList.remove('emotion-button--beat');
      return;
    }

    let raf = 0;
    let pollTimer = 0;
    let idleFrames = 0;
    let cancelled = false;
    host.classList.add('emotion-button--beat');

    const stopRaf = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const tick = () => {
      if (cancelled) return;
      const beat = getAtmospherePresentationBeatPulse();
      if (beat < 0.02) {
        host.style.setProperty('--emotion-beat', '0');
        idleFrames += 1;
        if (idleFrames > 40) {
          stopRaf();
          pollTimer = window.setInterval(() => {
            if (cancelled) return;
            if (getAtmospherePresentationBeatPulse() >= 0.02) {
              window.clearInterval(pollTimer);
              pollTimer = 0;
              idleFrames = 0;
              raf = requestAnimationFrame(tick);
            }
          }, 200);
          return;
        }
      } else {
        idleFrames = 0;
        host.style.setProperty('--emotion-beat', beat.toFixed(3));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      stopRaf();
      if (pollTimer) window.clearInterval(pollTimer);
      host.style.removeProperty('--emotion-beat');
      host.classList.remove('emotion-button--beat');
    };
  }, [beatPulseEnabled, loading, emotionId]);

  if (loading) {
    return (
      <button
        type="button"
        className={`emotion-button loading ${className}`}
        disabled
        aria-label="分析情绪中"
      >
        <span className="emotion-button-face">
          <span className="emotion-icon">⏳</span>
          {!compact && <span className="emotion-text">分析中...</span>}
        </span>
      </button>
    );
  }

  if (!currentEmotion || !emotionId) {
    return null;
  }

  return (
    <span className="emotion-button-wrap">
      {correctionNotice ? (
        <span className="emotion-correction-notice" role="status">
          {correctionNotice}
        </span>
      ) : null}
      <button
        ref={hostRef}
        type="button"
        className={[
          'emotion-button',
          compact ? 'emotion-button--compact' : '',
          compactLabelOpen ? 'emotion-button--label-reveal' : '',
          correctionFlash ? 'emotion-button--correction-flash' : '',
          className,
        ].filter(Boolean).join(' ')}
        onClick={openSelector}
        title={correctionNotice || `当前情绪: ${emotionName} (点击修改)`}
        aria-label={`当前情绪 ${emotionName}，点击修改`}
      >
        <span ref={faceRef} className="emotion-button-face">
          <span className="emotion-icon">{getEmotionIcon(emotionId)}</span>
          {showLabel && (
            <>
              <span ref={labelRef} className="emotion-text emotion-text--scramble">
                {emotionName}
              </span>
              {currentEmotion.source === 'user' && (
                <span className="emotion-badge" title="用户修正">✓</span>
              )}
            </>
          )}
        </span>
      </button>
    </span>
  );
};

/**
 * 获取情绪图标
 * Get emotion icon
 */
function getEmotionIcon(emotion: string): string {
  const icons: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    energetic: '⚡',
    calm: '🌊',
    angry: '😠',
    romantic: '💕',
    melancholic: '😔',
    uplifting: '🌟',
    relaxed: '😌',
    tense: '😰',
    neutral: '😐',
  };
  return icons[emotion] || '🎵';
}
