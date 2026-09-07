import type { CommandPaletteCommand } from './types';
import { applyQueueQueryAction } from '../../utils/queue/applyQueueQueryAction';
import { evaluateQueueQuery } from '../../utils/queue/evaluateQueueQuery';

// src/components/command-palette/queueCommands.ts
// Queue search plus Folia-style --remove / --next / --end batch actions.

const describeQueuePreview = (
    input: string,
    context: Parameters<NonNullable<CommandPaletteCommand['getPreview']>>[1],
): string => {
    const { parsed, matches } = evaluateQueueQuery(context.playQueue, input);
    if (parsed.action === 'remove') {
        return context.t('commandPalette.previewQueueRemove', 'Remove {{count}} from queue')
            .replace('{{count}}', String(matches.length));
    }
    if (parsed.action === 'next') {
        return context.t('commandPalette.previewQueueNext', 'Play {{count}} next')
            .replace('{{count}}', String(matches.length));
    }
    if (parsed.action === 'end') {
        return context.t('commandPalette.previewQueueEnd', 'Move {{count}} to end of queue')
            .replace('{{count}}', String(matches.length));
    }
    if (parsed.range) {
        return context.t('commandPalette.previewQueueRange', 'Queue #{{from}}–#{{to}} · {{count}} tracks')
            .replace('{{from}}', String(parsed.range.from))
            .replace('{{to}}', String(parsed.range.to))
            .replace('{{count}}', String(matches.length));
    }
    return context.t('commandPalette.previewQueueSearch', 'Search current queue: {{query}}')
        .replace('{{query}}', input);
};

export const QUEUE_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'queue',
        group: 'playback',
        title: 'Queue',
        description: 'Search or batch-edit the current play queue',
        keywords: ['queue', '播放队列', '队列搜索', 'duilie', 'duiliesousuo', 'dl', 'dlss', '--remove', '--next', '--end'],
        placeholder: 'queue #3 · 3-7 · artist:yoasobi · --remove',
        requiresInput: true,
        getPreview: (input, context) => {
            const trimmedInput = input.trim();
            if (!trimmedInput) {
                return context.t(
                    'commandPalette.previewQueueSearchEmpty',
                    'Type a song name, #index, 3-7, artist:, or --remove/--next/--end',
                );
            }
            return describeQueuePreview(trimmedInput, context);
        },
        execute: (input, context) => {
            const trimmedInput = input.trim();
            if (!trimmedInput || context.playQueue.length === 0) return false;

            const { parsed, matches } = evaluateQueueQuery(context.playQueue, trimmedInput);
            if (matches.length === 0) return false;

            const hasSelector = Boolean(
                parsed.text || parsed.index !== null || parsed.range || parsed.facetKind,
            );
            if (parsed.action !== 'play' && !hasSelector) return false;

            if (parsed.action === 'play') {
                const first = matches[0];
                if (!first) return false;
                void context.playSong(first.song, context.playQueue);
                return true;
            }

            const result = applyQueueQueryAction({
                queue: context.playQueue,
                currentSong: context.currentSong,
                matches,
                action: parsed.action,
            });
            if (!result.changed) return false;

            const toast = parsed.action === 'remove'
                ? context.t('status.queueRemoved', 'Removed from queue')
                : parsed.action === 'next'
                    ? context.t('status.queueMovedNext', 'Moved to play next')
                    : context.t('status.queueMovedEnd', 'Moved to end of queue');
            return context.replacePlayQueue(result.nextQueue, toast);
        },
    },
];
