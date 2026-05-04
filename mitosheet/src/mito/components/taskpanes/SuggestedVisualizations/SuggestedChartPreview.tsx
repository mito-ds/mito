/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { useMemo } from 'react';
import { SheetData } from '../../../types';

const PREVIEW_INPUT_LIMIT = 400;
const PREVIEW_POINT_LIMIT_DEFAULT = 16;
const PREVIEW_POINT_LIMIT_SCATTER = 72;
const PREVIEW_POINT_LIMIT_BOX = 96;
const WIDTH = 320;
const HEIGHT = 170;
/** Left inset: room for Y tick labels before the plot + y-axis spine */
const LEFT = 30;
const RIGHT = 8;
const TOP = 16;
/** Bottom inset: room for X tick labels below the x-axis */
const BOTTOM = 24;
const PURPLE = '#8b5cf6';
const AXIS_STROKE = 'rgba(31,41,55,0.32)';
const GRID_STROKE = 'rgba(31,41,55,0.14)';
const TICK_FILL = 'rgba(31,41,55,0.5)';

const formatTick = (v: number): string => {
    if (!Number.isFinite(v)) {
        return '';
    }
    const a = Math.abs(v);
    if (a >= 10000 || (a > 0 && a < 1e-4)) {
        return v.toExponential(0);
    }
    if (Number.isInteger(v) || Math.abs(v - Math.round(v)) < 1e-6) {
        return String(Math.round(v));
    }
    return v.toFixed(1).replace(/\.0$/, '');
};

const truncateLabel = (s: string, maxLen: number): string => {
    const t = s.trim();
    if (t.length <= maxLen) {
        return t;
    }
    return `${t.slice(0, Math.max(1, maxLen - 1))}…`;
};

type YRange = { min: number; max: number };

const yTickValues = (lo: number, hi: number): number[] => {
    if (lo === hi) {
        return [lo];
    }
    return [lo, (lo + hi) / 2, hi];
};

type XTick = { x: number; label: string; anchor?: 'start' | 'middle' | 'end' };

function renderPreviewAxes(params: {
    plotW: number;
    plotH: number;
    left: number;
    top: number;
    yRange: YRange;
    scaleYValue: (v: number, lo: number, hi: number) => number;
    xTicks: XTick[];
}): JSX.Element {
    const { plotW, plotH, left, top, yRange, scaleYValue, xTicks } = params;
    const bottom = top + plotH;
    const right = left + plotW;
    const yVals = yTickValues(yRange.min, yRange.max);

    return (
        <>
            {yVals.map((v, i) => {
                const y = scaleYValue(v, yRange.min, yRange.max);
                if (Math.abs(y - bottom) < 0.75) {
                    return null;
                }
                return (
                    <line
                        key={`grid-y-${i}`}
                        x1={left}
                        y1={y}
                        x2={right}
                        y2={y}
                        stroke={GRID_STROKE}
                        strokeWidth="1"
                    />
                );
            })}
            <line x1={left} y1={top} x2={left} y2={bottom} stroke={AXIS_STROKE} strokeWidth="1" />
            <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={AXIS_STROKE} strokeWidth="1" />
            {yVals.map((v, i) => (
                <text key={`ytick-${i}`} x={left - 5} y={scaleYValue(v, yRange.min, yRange.max) + 3} textAnchor="end" fill={TICK_FILL} fontSize="9">
                    {formatTick(v)}
                </text>
            ))}
            {xTicks.map((t, i) => (
                <text key={`xtick-${i}`} x={t.x} y={bottom + 12} textAnchor={t.anchor ?? 'middle'} fill={TICK_FILL} fontSize="9">
                    {t.label}
                </text>
            ))}
        </>
    );
}

const toNumberArray = (values: (string | number | boolean)[]): number[] => {
    return values.map((v, i) => {
        if (typeof v === 'number') {
            return v;
        }
        if (typeof v === 'boolean') {
            return v ? 1 : 0;
        }
        const parsed = Number(v);
        return Number.isFinite(parsed) ? parsed : i + 1;
    });
};

const minMax = (values: number[]): { min: number; max: number } => {
    if (values.length === 0) {
        return { min: 0, max: 1 };
    }
    let min = values[0];
    let max = values[0];
    for (const v of values) {
        min = Math.min(min, v);
        max = Math.max(max, v);
    }
    if (min === max) {
        return { min: min - 1, max: max + 1 };
    }
    return { min, max };
};

const quantile = (values: number[], q: number): number => {
    if (values.length === 0) {
        return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const low = Math.floor(pos);
    const high = Math.ceil(pos);
    if (low === high) {
        return sorted[low];
    }
    const ratio = pos - low;
    return sorted[low] * (1 - ratio) + sorted[high] * ratio;
};

const sampleEvenly = (values: number[], limit: number): number[] => {
    if (values.length <= limit) {
        return values;
    }
    const sampled: number[] = [];
    for (let i = 0; i < limit; i++) {
        const idx = Math.floor((i / (limit - 1)) * (values.length - 1));
        sampled.push(values[idx]);
    }
    return sampled;
};

const samplePairsByXBins = (xs: number[], ys: number[], limit: number): { xs: number[]; ys: number[] } => {
    const n = Math.min(xs.length, ys.length);
    if (n <= limit) {
        return { xs: xs.slice(0, n), ys: ys.slice(0, n) };
    }

    const xr = minMax(xs);
    const bins = Math.max(6, Math.min(18, Math.floor(Math.sqrt(limit))));
    const span = xr.max - xr.min;
    const binWidth = span / bins;

    if (binWidth <= 0) {
        return {
            xs: sampleEvenly(xs, limit),
            ys: sampleEvenly(ys, limit),
        };
    }

    const bucketIndices: number[][] = new Array(bins).fill(undefined).map(() => []);
    for (let i = 0; i < n; i++) {
        const idx = Math.min(bins - 1, Math.floor((xs[i] - xr.min) / binWidth));
        bucketIndices[idx].push(i);
    }

    const perBin = Math.max(1, Math.floor(limit / bins));
    const chosen: number[] = [];

    for (const bucket of bucketIndices) {
        if (bucket.length === 0) {
            continue;
        }
        if (bucket.length <= perBin) {
            chosen.push(...bucket);
            continue;
        }
        // Evenly sample within each x-bin for better shape retention.
        for (let j = 0; j < perBin; j++) {
            const idx = Math.floor((j / Math.max(1, perBin - 1)) * (bucket.length - 1));
            chosen.push(bucket[idx]);
        }
    }

    // Top up if sparse bins underfilled.
    if (chosen.length < limit) {
        const step = Math.max(1, Math.floor(n / (limit - chosen.length + 1)));
        for (let i = 0; i < n && chosen.length < limit; i += step) {
            chosen.push(i);
        }
    }

    chosen.sort((a, b) => a - b);
    const deduped: number[] = [];
    let prev = -1;
    for (const i of chosen) {
        if (i !== prev) {
            deduped.push(i);
            prev = i;
        }
        if (deduped.length >= limit) {
            break;
        }
    }

    return {
        xs: deduped.map(i => xs[i]),
        ys: deduped.map(i => ys[i]),
    };
};

const SuggestedChartPreview = (props: {
    graphType: string;
    columnIndices: number[];
    sheetData?: SheetData;
}): JSX.Element => {
    const chart = useMemo(() => {
        if (props.sheetData === undefined) {
            return undefined;
        }
        const cols = props.columnIndices
            .map(i => props.sheetData?.data[i])
            .filter((c): c is SheetData['data'][number] => c !== undefined);
        if (cols.length === 0) {
            return undefined;
        }
        const limited = cols.map(c => sampleEvenly(toNumberArray(c.columnData), PREVIEW_INPUT_LIMIT));
        const first = limited[0];
        const second = limited[1];
        const firstNumeric = sampleEvenly(first, PREVIEW_POINT_LIMIT_DEFAULT);
        const secondNumeric = second ? sampleEvenly(second, PREVIEW_POINT_LIMIT_DEFAULT) : undefined;
        const plotW = WIDTH - LEFT - RIGHT;
        const plotH = HEIGHT - TOP - BOTTOM;
        const t = props.graphType.trim().toLowerCase();

        const scaleXIndex = (i: number, n: number): number => LEFT + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
        const scaleXValue = (v: number, lo: number, hi: number): number => LEFT + ((v - lo) / (hi - lo)) * plotW;
        const scaleYValue = (v: number, lo: number, hi: number): number => TOP + (1 - (v - lo) / (hi - lo)) * plotH;

        const axisEl = (yRange: YRange, xTicks: XTick[]): JSX.Element =>
            renderPreviewAxes({ plotW, plotH, left: LEFT, top: TOP, yRange, scaleYValue, xTicks });

        if (t === 'scatter') {
            const scatterXRaw = second ? first : first.map((_, i) => i + 1);
            const scatterYRaw = second ? second : first;
            const sampledPairs = samplePairsByXBins(scatterXRaw, scatterYRaw, PREVIEW_POINT_LIMIT_SCATTER);
            const xs = sampledPairs.xs;
            const ys = sampledPairs.ys;
            const xr = minMax(xs);
            const yr = minMax(ys);
            const xTickVals = yTickValues(xr.min, xr.max);
            const xTicks: XTick[] = xTickVals.map(v => ({
                x: scaleXValue(v, xr.min, xr.max),
                label: formatTick(v),
                anchor: 'middle',
            }));
            const circles = ys.map((y, i) => (
                <circle key={i} cx={scaleXValue(xs[i], xr.min, xr.max)} cy={scaleYValue(y, yr.min, yr.max)} r="2.4" fill={PURPLE} opacity="0.82" />
            ));
            return (
                <>
                    {axisEl(yr, xTicks)}
                    {circles}
                </>
            );
        }
        if (t === 'line') {
            const yr = minMax(firstNumeric);
            const n = firstNumeric.length;
            const idxs =
                n <= 1 ? [0] : [...new Set([0, Math.floor((n - 1) / 2), n - 1])].sort((a, b) => a - b);
            const xTicks: XTick[] = idxs.map(i => ({
                x: scaleXIndex(i, n),
                label: String(i + 1),
                anchor: 'middle',
            }));
            const path = firstNumeric.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleXIndex(i, firstNumeric.length)} ${scaleYValue(v, yr.min, yr.max)}`).join(' ');
            return (
                <>
                    {axisEl(yr, xTicks)}
                    <path d={path} fill="none" stroke={PURPLE} strokeWidth="2.2" />
                    {firstNumeric.map((v, i) => (
                        <circle key={i} cx={scaleXIndex(i, firstNumeric.length)} cy={scaleYValue(v, yr.min, yr.max)} r="1.8" fill={PURPLE} />
                    ))}
                </>
            );
        }
        if (t === 'histogram') {
            const r = minMax(firstNumeric);
            const bins = 8;
            const step = (r.max - r.min) / bins;
            const counts = new Array(bins).fill(0);
            for (const v of firstNumeric) {
                const idx = Math.min(bins - 1, Math.floor((v - r.min) / Math.max(step, 1e-9)));
                counts[idx] += 1;
            }
            const cr = minMax(counts);
            const bw = plotW / bins;
            const xTicks: XTick[] = [
                { x: LEFT + 8, label: formatTick(r.min), anchor: 'start' },
                { x: LEFT + plotW - 8, label: formatTick(r.max), anchor: 'end' },
            ];
            const bars = counts.map((c, i) => {
                const y = scaleYValue(c, cr.min, cr.max);
                return <rect key={i} x={LEFT + i * bw + 1} y={y} width={Math.max(1, bw - 2)} height={TOP + plotH - y} fill={PURPLE} opacity="0.8" rx="1" />;
            });
            return (
                <>
                    {axisEl(cr, xTicks)}
                    {bars}
                </>
            );
        }
        if (t === 'box' || t === 'violin' || t === 'strip') {
            const boxValues = sampleEvenly(first, PREVIEW_POINT_LIMIT_BOX);
            const lo = quantile(boxValues, 0.25);
            const mid = quantile(boxValues, 0.5);
            const hi = quantile(boxValues, 0.75);
            const r = minMax(boxValues);
            const cx = LEFT + plotW / 2;
            const yLo = scaleYValue(lo, r.min, r.max);
            const yMid = scaleYValue(mid, r.min, r.max);
            const yHi = scaleYValue(hi, r.min, r.max);
            return (
                <>
                    {axisEl(r, [])}
                    <line x1={cx} y1={scaleYValue(r.min, r.min, r.max)} x2={cx} y2={scaleYValue(r.max, r.min, r.max)} stroke={PURPLE} opacity="0.6" />
                    <rect x={cx - 26} y={yHi} width={52} height={Math.max(2, yLo - yHi)} fill={PURPLE} opacity="0.22" stroke={PURPLE} />
                    <line x1={cx - 26} y1={yMid} x2={cx + 26} y2={yMid} stroke={PURPLE} strokeWidth="2" />
                </>
            );
        }
        if (t === 'ecdf') {
            const sorted = [...firstNumeric].sort((a, b) => a - b);
            const n = sorted.length;
            const yr: YRange = { min: 0, max: 1 };
            const xTicks: XTick[] =
                n === 0
                    ? []
                    : n === 1
                      ? [{ x: scaleXIndex(0, 1), label: formatTick(sorted[0]), anchor: 'middle' }]
                      : [
                            { x: scaleXIndex(0, n), label: formatTick(sorted[0]), anchor: 'start' },
                            { x: scaleXIndex(n - 1, n), label: formatTick(sorted[n - 1]), anchor: 'end' },
                        ];
            const pts = sorted.map((v, i) => ({
                x: scaleXIndex(i, sorted.length),
                y: scaleYValue((i + 1) / sorted.length, 0, 1),
            }));
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            return (
                <>
                    {axisEl(yr, xTicks)}
                    <path d={path} fill="none" stroke={PURPLE} strokeWidth="2.2" />
                </>
            );
        }
        if ((t === 'density heatmap' || t === 'density contour') && secondNumeric !== undefined) {
            const xr = minMax(firstNumeric);
            const yr = minMax(secondNumeric);
            const xTickVals = yTickValues(xr.min, xr.max);
            const xTicks: XTick[] = xTickVals.map(v => ({
                x: scaleXValue(v, xr.min, xr.max),
                label: formatTick(v),
                anchor: 'middle',
            }));
            const marks = firstNumeric.map((x, i) => (
                <circle key={i} cx={scaleXValue(x, xr.min, xr.max)} cy={scaleYValue(secondNumeric[i], yr.min, yr.max)} r="3.2" fill={PURPLE} opacity="0.22" />
            ));
            return (
                <>
                    {axisEl(yr, xTicks)}
                    {marks}
                </>
            );
        }
        const barValues = secondNumeric ?? firstNumeric;
        const br = minMax(barValues);
        const n = Math.max(1, barValues.length);
        const bw = plotW / n;
        const catCol = secondNumeric !== undefined ? cols[0] : undefined;
        const idxs =
            n <= 1 ? [0] : [...new Set([0, Math.floor((n - 1) / 2), n - 1])].sort((a, b) => a - b);
        const xTicks: XTick[] = idxs.map(i => {
            const xPos = scaleXIndex(i, n);
            let label: string;
            if (catCol !== undefined && catCol.columnData.length > 0) {
                const dataIdx = Math.min(
                    catCol.columnData.length - 1,
                    Math.round((i / Math.max(1, n - 1)) * (catCol.columnData.length - 1)),
                );
                label = truncateLabel(String(catCol.columnData[dataIdx]), 8);
            } else {
                label = String(i + 1);
            }
            return { x: xPos, label, anchor: 'middle' as const };
        });
        const bars = barValues.map((v, i) => {
            const y = scaleYValue(v, br.min, br.max);
            return (
                <rect key={i} x={LEFT + i * bw + 1} y={y} width={Math.max(1, bw - 2)} height={TOP + plotH - y} fill={PURPLE} opacity="0.82" rx="1" />
            );
        });
        return (
            <>
                {axisEl(br, xTicks)}
                {bars}
            </>
        );
    }, [props.columnIndices, props.graphType, props.sheetData]);

    return (
        <svg className="suggested-viz-preview-plot" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
            {chart}
        </svg>
    );
};

export default SuggestedChartPreview;
