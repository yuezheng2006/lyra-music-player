import { describe, expect, it } from 'vitest';
import {
  buildProviderDownloadRelativePath,
  formatDownloadArtists,
  guessAudioExtension,
  sanitizeDownloadFileName,
} from '../../../src/utils/ui/downloadDirectoryMath';

// test/unit/ui/downloadDirectoryMath.test.ts

describe('downloadDirectoryMath', () => {
  it('sanitizes illegal path characters', () => {
    expect(sanitizeDownloadFileName('a/b:c*d?.mp3')).toBe('a b c d .mp3');
    expect(sanitizeDownloadFileName('   ')).toBe('Untitled');
  });

  it('formats artist lists', () => {
    expect(formatDownloadArtists(['A', 'B'])).toBe('A, B');
    expect(formatDownloadArtists('Solo')).toBe('Solo');
  });

  it('builds provider-relative readable paths', () => {
    expect(buildProviderDownloadRelativePath({
      providerId: 'Qishui',
      title: '夜曲',
      artists: ['周杰伦'],
      extension: '.flac',
    })).toBe('qishui/周杰伦 - 夜曲.flac');
  });

  it('guesses extension from mime or url', () => {
    expect(guessAudioExtension({ mimeType: 'audio/flac' })).toBe('flac');
    expect(guessAudioExtension({ audioUrl: 'https://cdn.example/a.m4a?token=1' })).toBe('m4a');
    expect(guessAudioExtension({})).toBe('mp3');
  });
});
