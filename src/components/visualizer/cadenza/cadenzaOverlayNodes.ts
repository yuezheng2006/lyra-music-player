import type { OverlayWordNodes } from './cadenzaTypes';

// src/components/visualizer/cadenza/cadenzaOverlayNodes.ts
// Imperative DOM overlay nodes for cadenza glyphs (updated from RAF, not React).

export const createOverlayWordNodes = (): OverlayWordNodes => {
    const outer = document.createElement('div');
    outer.className = 'absolute left-0 top-0';
    outer.setAttribute('aria-hidden', 'true');
    outer.style.transformStyle = 'preserve-3d';

    const inner = document.createElement('div');
    inner.className = 'whitespace-nowrap';
    inner.style.lineHeight = '1';
    inner.style.display = 'inline-block';
    inner.style.position = 'relative';
    inner.style.transformStyle = 'preserve-3d';

    const body = document.createElement('span');
    body.style.lineHeight = '1';
    body.style.display = 'block';
    body.style.position = 'relative';
    body.style.zIndex = '1';
    body.style.whiteSpace = 'pre';

    const glow = document.createElement('span');
    glow.style.color = 'transparent';
    glow.style.lineHeight = '1';
    glow.style.display = 'block';
    glow.style.position = 'absolute';
    glow.style.inset = '0';
    glow.style.zIndex = '0';
    glow.style.pointerEvents = 'none';
    glow.style.whiteSpace = 'pre';

    inner.appendChild(body);
    inner.appendChild(glow);
    outer.appendChild(inner);

    return {
        outer,
        inner,
        body,
        glow,
        glyphSpans: [],
        glyphSignature: '',
    };
};

export const syncOverlayGlyphSpans = (nodes: OverlayWordNodes, texts: string[]) => {
    const glyphSignature = texts.join('\u0001');
    if (nodes.glyphSignature === glyphSignature) {
        return;
    }

    nodes.glow.replaceChildren();
    nodes.glyphSpans = texts.map(text => {
        const span = document.createElement('span');
        span.textContent = text;
        span.style.color = 'transparent';
        span.style.lineHeight = '1';
        nodes.glow.appendChild(span);
        return span;
    });
    nodes.glyphSignature = glyphSignature;
};

export const clearOverlayWordNodes = (overlayNodes: Map<string, OverlayWordNodes>) => {
    overlayNodes.forEach(nodes => {
        nodes.outer.remove();
    });
    overlayNodes.clear();
};
