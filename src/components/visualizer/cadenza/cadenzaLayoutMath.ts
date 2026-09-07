import { layoutWithLines, prepareWithSegments, type LayoutCursor, type PreparedTextWithSegments } from '@chenglou/pretext';
import type { Line, Theme } from '../../../types';
import { buildWordGraphemeTimings } from '../../../utils/lyrics/graphemeTiming';
import { resolveThemeFontStack, resolveThemeFontWeight } from '../../../utils/fontStacks';
import { resolveWordColor } from '../wordColoring';
import { clamp, isCJK, splitGraphemes } from './cadenzaMath';
import type {
    LayoutLine,
    PreparedState,
    PreparedStateCacheContext,
    SegmentMeta,
    WordFragment,
    WordPlacement,
    WordRange,
} from './cadenzaTypes';

// src/components/visualizer/cadenza/cadenzaLayoutMath.ts
// Folia-parity cadenza hero sizing + collision placements (pretext measure, not React).

/** Folia cadenza hero size: width-driven, not the Lyra safety cap. */
export const chooseCadenzaFontPx = (width: number, line: Line) => {
    const graphemeCount = splitGraphemes(line.fullText).length || 1;
    const wordCount = line.words.length || 1;
    const widthBase = clamp(width * 0.086, 34, 94);
    const lengthPenalty = graphemeCount > 12 ? Math.min((graphemeCount - 12) * 1.8, 34) : 0;
    const densityPenalty = wordCount > 7 ? Math.min((wordCount - 7) * 1.5, 18) : 0;
    return clamp(widthBase - lengthPenalty - densityPenalty, 28, 104);
};

const buildCanvasFont = (theme: Theme, fontPx: number) => (
    `${resolveThemeFontWeight(theme, 700)} ${fontPx}px ${resolveThemeFontStack(theme)}`
);

export const buildPreparedState = (
    line: Line,
    context: PreparedStateCacheContext,
) => {
    const { showText, viewport, theme, tuning } = context;

    if (!showText || viewport.width <= 0 || viewport.height <= 0) {
        return null;
    }

    const fontPx = clamp(chooseCadenzaFontPx(viewport.width, line) * tuning.fontScale, 24, 132);
    const font = buildCanvasFont(theme, fontPx);
    // This is the expensive part of the mode.
    // Once a line reaches here, we fully measure it, wrap it, split it, and convert it into placement-ready fragments.
    const prepared = prepareWithSegments(line.fullText, font);
    const text = prepared.segments.join('');
    const { segmentMetas, graphemes } = buildSegmentMetas(prepared);
    const lineHeight = Math.round(fontPx * (isCJK(text) ? 1.22 : 1.1));
    const availableWidth = Math.max(viewport.width - 48, 120);
    const minWidth = Math.min(220, availableWidth);
    const wrapCompression = graphemes.length > 12
        ? clamp(0.92 - (graphemes.length - 12) * 0.018, 0.62, 0.92)
        : 0.92;
    const compactWidthRatio = tuning.widthRatio * wrapCompression;
    const maxWidth = clamp(Math.min(viewport.width * compactWidthRatio, 820), minWidth, availableWidth);
    const layout = layoutWithLines(prepared, maxWidth, lineHeight);
    const ranges = findWordRanges(line, graphemes, theme);
    const lineFragments = buildLineFragments(prepared, segmentMetas, graphemes, layout, ranges);
    const placements = buildWordPlacements(
        lineFragments,
        fontPx,
        lineHeight,
        maxWidth,
        theme.animationIntensity,
        line.startTime * 1000,
        line.fullText === '......',
    );

    return {
        prepared,
        text,
        font,
        fontPx,
        lineHeight,
        maxWidth,
        layout,
        segmentMetas,
        graphemes,
        placements,
    };
};

const getActiveColor = (wordText: string, theme: Theme) => {
    return resolveWordColor(wordText, theme.wordColors, theme.primaryColor);
};

const buildSegmentMetas = (prepared: PreparedTextWithSegments) => {
    // pretext works in segments, but most animation logic wants global grapheme offsets.
    // This bridge lets us move back and forth between those two coordinate systems.
    const segmentMetas: SegmentMeta[] = [];
    const graphemes: string[] = [];
    let graphemeCursor = 0;

    for (const segment of prepared.segments) {
        const segmentGraphemes = splitGraphemes(segment);
        segmentMetas.push({
            graphemeStart: graphemeCursor,
            graphemeEnd: graphemeCursor + segmentGraphemes.length,
            graphemeCount: segmentGraphemes.length,
        });
        graphemes.push(...segmentGraphemes);
        graphemeCursor += segmentGraphemes.length;
    }

    return { segmentMetas, graphemes };
};

const findWordRanges = (line: Line, graphemes: string[], theme: Theme) => {
    // We have to remap lyric words back onto the grapheme stream after pretext segmentation.
    // If this goes wrong, glow/highlight gets assigned to the wrong text slice.
    const ranges: WordRange[] = [];
    let cursor = 0;

    for (let wordIndex = 0; wordIndex < line.words.length; wordIndex++) {
        const word = line.words[wordIndex]!;
        const target = splitGraphemes(word.text);
        let start = -1;

        for (let i = cursor; i <= graphemes.length - target.length; i++) {
            let isMatch = true;
            for (let j = 0; j < target.length; j++) {
                if (graphemes[i + j] !== target[j]) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) {
                start = i;
                break;
            }
        }

        if (start === -1) {
            start = clamp(cursor, 0, graphemes.length);
        }

        const end = clamp(start + target.length, start, graphemes.length);

        ranges.push({
            wordIndex,
            word,
            start,
            end,
            color: getActiveColor(word.text, theme),
            graphemeTimings: buildWordGraphemeTimings(word),
        });

        cursor = end;
    }

    return ranges;
};

const cursorToGlobalOffset = (cursor: LayoutCursor, segmentMetas: SegmentMeta[]) => {
    if (segmentMetas.length === 0) return 0;
    const segment = segmentMetas[cursor.segmentIndex];

    if (!segment) {
        return segmentMetas[segmentMetas.length - 1]!.graphemeEnd;
    }

    return clamp(segment.graphemeStart + cursor.graphemeIndex, segment.graphemeStart, segment.graphemeEnd);
};

const getPartialSegmentWidth = (
    prepared: PreparedTextWithSegments,
    segmentIndex: number,
    segmentMeta: SegmentMeta,
    startOffset: number,
    endOffset: number,
) => {
    const localStart = clamp(startOffset - segmentMeta.graphemeStart, 0, segmentMeta.graphemeCount);
    const localEnd = clamp(endOffset - segmentMeta.graphemeStart, 0, segmentMeta.graphemeCount);

    if (localEnd <= localStart) return 0;
    if (localStart === 0 && localEnd === segmentMeta.graphemeCount) {
        return prepared.widths[segmentIndex] ?? 0;
    }

    const breakableFitAdvances = prepared.breakableFitAdvances[segmentIndex];
    if (breakableFitAdvances && breakableFitAdvances.length > 0) {
        let width = 0;
        for (let i = localStart; i < localEnd; i++) {
            width += breakableFitAdvances[i] ?? 0;
        }
        return width;
    }

    const fullWidth = prepared.widths[segmentIndex] ?? 0;
    if (segmentMeta.graphemeCount === 0) return fullWidth;
    return fullWidth * ((localEnd - localStart) / segmentMeta.graphemeCount);
};

const widthBetweenOffsets = (
    prepared: PreparedTextWithSegments,
    segmentMetas: SegmentMeta[],
    startOffset: number,
    endOffset: number,
) => {
    if (endOffset <= startOffset) return 0;

    let width = 0;

    for (let segmentIndex = 0; segmentIndex < segmentMetas.length; segmentIndex++) {
        const meta = segmentMetas[segmentIndex]!;
        if (endOffset <= meta.graphemeStart) break;
        if (startOffset >= meta.graphemeEnd) continue;

        const sliceStart = Math.max(startOffset, meta.graphemeStart);
        const sliceEnd = Math.min(endOffset, meta.graphemeEnd);
        width += getPartialSegmentWidth(prepared, segmentIndex, meta, sliceStart, sliceEnd);
    }

    return width;
};

const buildLineFragments = (
    prepared: PreparedTextWithSegments,
    segmentMetas: SegmentMeta[],
    graphemes: string[],
    layout: ReturnType<typeof layoutWithLines>,
    ranges: WordRange[],
) => {
    // Wrapped layout lines can cut straight through a lyric word.
    // So first build fragments per wrapped line, then later decide which fragments are still "the same word".
    const lineViews = layout.lines.map(line => {
        const lineStart = cursorToGlobalOffset(line.start, segmentMetas);
        const lineEnd = cursorToGlobalOffset(line.end, segmentMetas);

        const fragments = ranges.flatMap(range => {
            if (range.end <= lineStart || range.start >= lineEnd) {
                return [];
            }

            const fragmentStart = Math.max(range.start, lineStart);
            const fragmentEnd = Math.min(range.end, lineEnd);
            return [{
                wordIndex: range.wordIndex,
                lineIndex: 0,
                word: range.word,
                text: graphemes.slice(fragmentStart, fragmentEnd).join(''),
                color: range.color,
                startX: widthBetweenOffsets(prepared, segmentMetas, lineStart, fragmentStart),
                endX: widthBetweenOffsets(prepared, segmentMetas, lineStart, fragmentEnd),
                fragmentStartInWord: fragmentStart - range.start,
                fragmentEndInWord: fragmentEnd - range.start,
                wordGraphemeCount: Math.max(range.end - range.start, 1),
                wordGraphemeTimings: range.graphemeTimings,
                fragmentIndexInWord: 0,
                fragmentCountInWord: 1,
                isPrimaryFragment: true,
                isSplitAcrossLines: false,
            }];
        });

        return { line, lineStart, lineEnd, fragments };
    });

    const fragmentCountByWord = new Map<number, number>();
    lineViews.forEach(lineView => {
        lineView.fragments.forEach(fragment => {
            fragmentCountByWord.set(
                fragment.wordIndex,
                (fragmentCountByWord.get(fragment.wordIndex) ?? 0) + 1,
            );
        });
    });

    const seenFragmentsByWord = new Map<number, number>();

    return lineViews.map((lineView, lineIndex) => ({
        ...lineView,
        fragments: lineView.fragments.map(fragment => {
            const fragmentCountInWord = fragmentCountByWord.get(fragment.wordIndex) ?? 1;
            const fragmentIndexInWord = seenFragmentsByWord.get(fragment.wordIndex) ?? 0;
            seenFragmentsByWord.set(fragment.wordIndex, fragmentIndexInWord + 1);

            return {
                ...fragment,
                lineIndex,
                fragmentIndexInWord,
                fragmentCountInWord,
                isPrimaryFragment: fragmentIndexInWord === 0,
                isSplitAcrossLines: fragmentCountInWord > 1,
            };
        }),
    }));
};

const buildEmphasisMap = (
    lineData: Array<{
        line: LayoutLine;
        lineStart: number;
        lineEnd: number;
        fragments: WordFragment[];
    }>,
    isInterlude: boolean,
) => {
    const emphasisMap = new Map<number, number>();

    if (isInterlude) {
        return emphasisMap;
    }

    const primaryFragments = lineData
        .flatMap(lineView => lineView.fragments)
        .filter(fragment => fragment.isPrimaryFragment);

    // A lyric word can be split across wrapped layout lines (for example "no-no" -> "no-" + "no").
    // Those fragments must not all inherit the same centered hero placement, or they stack on top
    // of one another. Only consider intact primary fragments as emphasis candidates.
    const candidates = primaryFragments
        .filter(fragment => !fragment.isSplitAcrossLines && fragment.text.trim().length > 0)
        .map(fragment => {
            const graphemeCount = Math.max(fragment.wordGraphemeCount, splitGraphemes(fragment.word.text).length, 1);
            const semanticWeight = isCJK(fragment.word.text) ? 0.18 : Math.min(graphemeCount * 0.08, 0.36);
            const centerBias = 1 - Math.abs(fragment.wordIndex - (primaryFragments.length - 1) / 2) / Math.max(primaryFragments.length, 1);
            return {
                fragment,
                score: semanticWeight + centerBias * 0.18,
            };
        })
        .sort((a, b) => b.score - a.score);

    const hero = candidates[0];
    if (hero) {
        const scoreBoost = 1 + clamp(hero.score - 0.48, 0, 0.52);
        emphasisMap.set(hero.fragment.wordIndex, 1.46 * scoreBoost);
    }

    return emphasisMap;
};

const buildWordPlacements = (
    lineData: Array<{
        line: LayoutLine;
        lineStart: number;
        lineEnd: number;
        fragments: WordFragment[];
    }>,
    fontPx: number,
    lineHeight: number,
    maxWidth: number,
    animationIntensity: Theme['animationIntensity'],
    seed: number,
    isInterlude: boolean,
) => {
    // This is where fragments stop being text slices and start becoming actual animated visual objects.
    // From this point on, everything is placement geometry and per-state motion data.
    const totalHeight = Math.max(lineData.length, 1) * lineHeight;
    const baseMargin = animationIntensity === 'calm' ? 4 : 6;
    const baseScale = animationIntensity === 'chaotic'
        ? 1.02
        : animationIntensity === 'calm'
            ? 1
            : 1.01;
    const emphasisMap = buildEmphasisMap(lineData, isInterlude);
    const heroWordIndex = [...emphasisMap.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const placements: WordPlacement[] = [];
    const occupiedRects: Array<{ left: number; top: number; right: number; bottom: number; }> = [];
    const occupiedBands = new Map<number, number[]>();
    const occupiedMarks: number[] = [];
    let occupiedQueryStamp = 0;
    const collisionBandSize = Math.max(24, Math.round(lineHeight * 0.9));

    const getBandIndex = (value: number) => Math.floor(value / collisionBandSize);
    const registerOccupiedRect = (rect: { left: number; top: number; right: number; bottom: number; }) => {
        const rectIndex = occupiedRects.length;
        occupiedRects.push(rect);

        const startBand = getBandIndex(rect.top);
        const endBand = getBandIndex(rect.bottom);
        for (let band = startBand; band <= endBand; band++) {
            const bucket = occupiedBands.get(band);
            if (bucket) {
                bucket.push(rectIndex);
            } else {
                occupiedBands.set(band, [rectIndex]);
            }
        }
    };
    const evaluateCollisionRect = (left: number, top: number, right: number, bottom: number) => {
        if (occupiedRects.length === 0) {
            return {
                intersects: false,
                overlapArea: 0,
            };
        }

        occupiedQueryStamp += 1;
        const stamp = occupiedQueryStamp;
        const startBand = getBandIndex(top);
        const endBand = getBandIndex(bottom);
        let intersects = false;
        let overlapArea = 0;

        for (let band = startBand; band <= endBand; band++) {
            const bucket = occupiedBands.get(band);
            if (!bucket) continue;

            for (let bucketIndex = 0; bucketIndex < bucket.length; bucketIndex++) {
                const rectIndex = bucket[bucketIndex]!;
                if (occupiedMarks[rectIndex] === stamp) {
                    continue;
                }
                occupiedMarks[rectIndex] = stamp;

                const rect = occupiedRects[rectIndex]!;
                const overlapWidth = Math.max(0, Math.min(right, rect.right) - Math.max(left, rect.left));
                const overlapHeight = Math.max(0, Math.min(bottom, rect.bottom) - Math.max(top, rect.top));
                if (overlapWidth <= 0 || overlapHeight <= 0) {
                    continue;
                }

                intersects = true;
                overlapArea += overlapWidth * overlapHeight;
            }
        }

        return {
            intersects,
            overlapArea,
        };
    };
    const pushPlacementRect = (left: number, top: number, width: number, height: number, padding: number) => {
        registerOccupiedRect({
            left: left - padding,
            top: top - height - padding,
            right: left + width + padding,
            bottom: top + padding,
        });
    };
    const placementPlans = lineData.flatMap((lineView, lineIndex) => {
        const lineLeft = -lineView.line.width / 2;
        const baselineY = -totalHeight / 2 + fontPx + lineIndex * lineHeight;

        return lineView.fragments.map((fragment, fragmentIndex) => {
            const emphasis = emphasisMap.get(fragment.wordIndex) ?? 1;
            const width = Math.max(fragment.endX - fragment.startX, fontPx * 0.18);
            const scale = emphasis > 1 ? baseScale * emphasis : baseScale;
            const height = fontPx * scale * 0.95;

            return {
                fragment,
                lineIndex,
                fragmentIndex,
                baseX: lineLeft + fragment.startX,
                baseY: baselineY,
                emphasis,
                width,
                height,
                scale,
                collisionWidth: width * scale * (emphasis > 1 ? 1.48 : 1.26),
                collisionHeight: height * (emphasis > 1 ? 1.36 : 1.24),
                padding: baseMargin + (emphasis > 1 ? 10 : 2),
            };
        });
    }).sort((a, b) => {
        const emphasisDelta = b.emphasis - a.emphasis;
        if (Math.abs(emphasisDelta) > 0.001) {
            return emphasisDelta;
        }
        if (a.lineIndex !== b.lineIndex) {
            return a.lineIndex - b.lineIndex;
        }
        return a.fragment.startX - b.fragment.startX;
    });
    const primaryPlanByWordIndex = new Map<number, (typeof placementPlans)[number]>();
    placementPlans.forEach(plan => {
        if (!primaryPlanByWordIndex.has(plan.fragment.wordIndex)) {
            primaryPlanByWordIndex.set(plan.fragment.wordIndex, plan);
        }
    });
    const heroPlan = heroWordIndex === null ? null : primaryPlanByWordIndex.get(heroWordIndex) ?? null;
    const heroMetrics = heroPlan
        ? {
            centerX: (heroPlan.width * heroPlan.scale) / 2,
            centerY: -heroPlan.height * 0.46,
            width: heroPlan.width * heroPlan.scale,
        }
        : null;

    placementPlans.forEach(plan => {
        const { fragment, lineIndex, fragmentIndex, emphasis, width, height, scale, collisionWidth, collisionHeight, padding } = plan;
        const wordSeed = seed + fragment.wordIndex * 17 + lineIndex * 31 + fragmentIndex * 13;
        const random = (offset: number) => {
            const x = Math.sin(wordSeed + offset) * 10000;
            return x - Math.floor(x);
        };
        const rotate = animationIntensity === 'calm' ? 0 : (random(3) - 0.5) * (animationIntensity === 'chaotic' ? 14 : 6);
        const rotateX = animationIntensity === 'calm' ? 0 : (random(9) - 0.5) * (animationIntensity === 'chaotic' ? 22 : 10);
        const z = animationIntensity === 'calm' ? 0 : (random(10) - 0.5) * (animationIntensity === 'chaotic' ? 56 : 28);
        const passedRotate = (random(4) - 0.5) * (animationIntensity === 'chaotic' ? 20 : 12);
        const entryOffsetX = isInterlude ? 0 : (random(11) - 0.5) * (animationIntensity === 'chaotic' ? 80 : 36);
        const entryOffsetY = isInterlude ? 0 : (random(12) - 0.5) * (animationIntensity === 'chaotic' ? 48 : 22);
        const step = Math.max(10, Math.round(fontPx * 0.14));
        const maxRadius = emphasis > 1
            ? Math.max(20, lineHeight * 0.5)
            : Math.max(lineHeight * 2.2, collisionWidth * 0.75, 56);
        let preferredX = emphasis > 1 ? -width / 2 : plan.baseX;
        let preferredY = emphasis > 1 ? 0 : plan.baseY;

        if (!isInterlude && emphasis <= 1 && heroMetrics) {
            const wordCenterX = preferredX + width / 2;
            const wordCenterY = preferredY - height * 0.46;
            let dx = wordCenterX - heroMetrics.centerX;
            let dy = wordCenterY - heroMetrics.centerY;
            const distance = Math.hypot(dx, dy);
            if (distance < 1) {
                dx = preferredX >= 0 ? 1 : -1;
                dy = lineIndex % 2 === 0 ? -0.65 : 0.65;
            }
            const minHeroSeparation = heroMetrics.width * 0.34 + width * 0.52 + padding * 2;
            if (distance < minHeroSeparation) {
                const normalizedDistance = Math.max(Math.hypot(dx, dy), 1);
                const ux = dx / normalizedDistance;
                const uy = dy / normalizedDistance;
                const push = minHeroSeparation - distance;
                preferredX += ux * push;
                preferredY += uy * push * 0.92;
            }
        }

        const horizontalMin = (-maxWidth / 2) - 72;
        const horizontalMax = (maxWidth / 2) + 72;
        const verticalMin = -Math.max(totalHeight * 0.9, lineHeight * 1.6);
        const verticalMax = Math.max(totalHeight * 0.9, lineHeight * 1.45);
        let chosenX = preferredX;
        let chosenY = preferredY;
        let found = false;
        let bestFallback = {
            x: preferredX,
            y: preferredY,
            score: Number.POSITIVE_INFINITY,
        };
        const baseAngle = heroMetrics && emphasis <= 1
            ? Math.atan2(preferredY, preferredX + width / 2)
            : 0;

        for (let radius = 0; radius <= maxRadius && !found; radius += step) {
            const sampleCount = radius === 0
                ? 1
                : emphasis > 1
                    ? 8
                    : Math.max(12, Math.round((Math.PI * 2 * radius) / Math.max(step * 1.1, 10)));
            const candidates = radius === 0
                ? [[0, 0]]
                : Array.from({ length: sampleCount }, (_, sampleIndex) => {
                    const angle = baseAngle + (sampleIndex / sampleCount) * Math.PI * 2;
                    const ellipseY = radius * (emphasis > 1 ? 0.8 : 0.92);
                    return [
                        Math.cos(angle) * radius,
                        Math.sin(angle) * ellipseY,
                    ] as const;
                });

            for (const [dx, dy] of candidates) {
                const left = preferredX + dx - padding;
                const top = preferredY + dy - collisionHeight - padding;
                const right = left + collisionWidth + padding * 2;
                const bottom = top + collisionHeight + padding * 2;
                const withinBounds = left >= horizontalMin
                    && right <= horizontalMax
                    && top >= verticalMin
                    && bottom <= verticalMax;
                if (!withinBounds) {
                    continue;
                }

                const collision = evaluateCollisionRect(left, top, right, bottom);
                const travel = Math.hypot(dx, dy);
                const score = collision.overlapArea * 2.2 + travel;
                if (score < bestFallback.score) {
                    bestFallback = {
                        x: preferredX + dx,
                        y: preferredY + dy,
                        score,
                    };
                }

                if (!collision.intersects) {
                    chosenX = preferredX + dx;
                    chosenY = preferredY + dy;
                    pushPlacementRect(chosenX, chosenY, collisionWidth, collisionHeight, padding);
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            chosenX = bestFallback.x;
            chosenY = bestFallback.y;
            pushPlacementRect(chosenX, chosenY, collisionWidth, collisionHeight, padding);
        }

        const outwardX = chosenX + width / 2;
        const outwardY = chosenY - height * 0.46;
        const outwardLength = Math.max(Math.hypot(outwardX, outwardY), 1);
        const outwardUnitX = outwardX / outwardLength;
        const outwardUnitY = outwardY / outwardLength;
        const driftAmount = isInterlude
            ? 3 + random(6) * 3
            : emphasis > 1
                ? 4 + random(6) * 4
                : animationIntensity === 'chaotic'
                    ? 8 + random(6) * 9
                    : 5 + random(6) * 6;
        const passedDriftX = outwardUnitX * driftAmount + (random(7) - 0.5) * 2.4;
        const passedDriftY = outwardUnitY * driftAmount * 0.72 + (random(8) - 0.5) * 2;

        placements.push({
            id: `${fragment.word.text}-${fragment.wordIndex}-${lineIndex}-${fragmentIndex}-${fragment.fragmentIndexInWord}`,
            wordIndex: fragment.wordIndex,
            word: fragment.word,
            text: fragment.text,
            color: fragment.color,
            x: chosenX,
            y: chosenY,
            width,
            height,
            rotate,
            rotateX,
            z,
            scale,
            passedRotate,
            passedDriftX,
            passedDriftY,
            entryOffsetX,
            entryOffsetY,
            fragmentStartInWord: fragment.fragmentStartInWord,
            fragmentEndInWord: fragment.fragmentEndInWord,
            wordGraphemeCount: fragment.wordGraphemeCount,
            wordGraphemeTimings: fragment.wordGraphemeTimings,
            emphasis,
            isInterlude,
        });
    });

    return placements;
};
