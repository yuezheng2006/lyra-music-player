import { Buffer } from 'buffer';
import { installGlobalVisualizerFrameRateLimiter } from './utils/frameRateLimiter';
import { silenceDevConsoleNoise } from './utils/dev/silenceDevConsoleNoise';

// @ts-ignore
globalThis.Buffer = Buffer;
silenceDevConsoleNoise();
installGlobalVisualizerFrameRateLimiter();

void import('./bootstrap');
