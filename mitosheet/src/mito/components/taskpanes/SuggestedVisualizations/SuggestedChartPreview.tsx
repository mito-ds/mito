/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { useMemo } from 'react';
import { SheetData } from '../../../types';

const PREVIEW_ROW_LIMIT = 30;
const WIDTH = 320;
const HEIGHT = 170;
const LEFT = 24;
const RIGHT = 8;
const TOP = 10;
const BOTTOM = 24;
const PURPLE = '#8b5cf6';

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
        const limited = cols.map(c => c.columnData.slice(0, PREVIEW_ROW_LIMIT));
        const first = limited[0];
        const second = limited[1];
        const firstNumeric = sampleEvenly(toNumberArray(first), 16);
        const secondNumeric = second ? sampleEvenly(toNumberArray(second), 16) : undefined;
        const plotW = WIDTH - LEFT - RIGHT;
        const plotH = HEIGHT - TOP - BOTTOM;
        const t = props.graphType.trim().toLowerCase();

        const axes = (
            <>
                <line x1={LEFT} y1={TOP} x2={LEFT} y2={TOP + plotH} stroke="rgba(31,41,55,0.35)" strokeWidth="1" />
                <line x1={LEFT} y1={TOP + plotH} x2={LEFT + plotW} y2={TOP + plotH} stroke="rgba(31,41,55,0.35)" strokeWidth="1" />
                <line x1={LEFT} y1={TOP + plotH * 0.33} x2={LEFT + plotW} y2={TOP + plotH * 0.33} stroke="rgba(31,41,55,0.18)" strokeWidth="1" />
                <line x1={LEFT} y1={TOP + plotH * 0.66} x2={LEFT + plotW} y2={TOP + plotH * 0.66} stroke="rgba(31,41,55,0.18)" strokeWidth="1" />
            </>
        );

        const scaleXIndex = (i: number, n: number): number => LEFT + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
        const scaleXValue = (v: number, lo: number, hi: number): number => LEFT + ((v - lo) / (hi - lo)) * plotW;
        const scaleYValue = (v: number, lo: number, hi: number): number => TOP + (1 - (v - lo) / (hi - lo)) * plotH;

        if (t === 'scatter') {
            const xs = secondNumeric ? firstNumeric : firstNumeric.map((_, i) => i + 1);
            const ys = secondNumeric ?? firstNumeric;
            const xr = minMax(xs);
            const yr = minMax(ys);
            const circles = ys.map((y, i) => (
                <circle key={i} cx={scaleXValue(xs[i], xr.min, xr.max)} cy={scaleYValue(y, yr.min, yr.max)} r="2.4" fill={PURPLE} opacity="0.82" />
            ));
            return { axes, marks: circles };
        }
        if (t === 'line') {
            const yr = minMax(firstNumeric);
            const path = firstNumeric.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleXIndex(i, firstNumeric.length)} ${scaleYValue(v, yr.min, yr.max)}`).join(' ');
            return {
                axes,
                marks: (
                    <>
                        <path d={path} fill="none" stroke={PURPLE} strokeWidth="2.2" />
                        {firstNumeric.map((v, i) => (
                            <circle key={i} cx={scaleXIndex(i, firstNumeric.length)} cy={scaleYValue(v, yr.min, yr.max)} r="1.8" fill={PURPLE} />
                        ))}
                    </>
                ),
            };
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
            const bars = counts.map((c, i) => {
                const y = scaleYValue(c, cr.min, cr.max);
                return <rect key={i} x={LEFT + i * bw + 1} y={y} width={Math.max(1, bw - 2)} height={TOP + plotH - y} fill={PURPLE} opacity="0.8" rx="1" />;
            });
            return { axes, marks: bars };
        }
        if (t === 'box' || t === 'violin' || t === 'strip') {
            const lo = quantile(firstNumeric, 0.25);
            const mid = quantile(firstNumeric, 0.5);
            const hi = quantile(firstNumeric, 0.75);
            const r = minMax(firstNumeric);
            const cx = LEFT + plotW / 2;
            const yLo = scaleYValue(lo, r.min, r.max);
            const yMid = scaleYValue(mid, r.min, r.max);
            const yHi = scaleYValue(hi, r.min, r.max);
            return {
                axes,
                marks: (
                    <>
                        <line x1={cx} y1={scaleYValue(r.min, r.min, r.max)} x2={cx} y2={scaleYValue(r.max, r.min, r.max)} stroke={PURPLE} opacity="0.6" />
                        <rect x={cx - 26} y={yHi} width={52} height={Math.max(2, yLo - yHi)} fill={PURPLE} opacity="0.22" stroke={PURPLE} />
                        <line x1={cx - 26} y1={yMid} x2={cx + 26} y2={yMid} stroke={PURPLE} strokeWidth="2" />
                    </>
                ),
            };
        }
        if (t === 'ecdf') {
            const sorted = [...firstNumeric].sort((a, b) => a - b);
            const pts = sorted.map((v, i) => ({
                x: scaleXIndex(i, sorted.length),
                y: scaleYValue((i + 1) / sorted.length, 0, 1),
            }));
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            return { axes, marks: <path d={path} fill="none" stroke={PURPLE} strokeWidth="2.2" /> };
        }
        if ((t === 'density heatmap' || t === 'density contour') && secondNumeric !== undefined) {
            const xr = minMax(firstNumeric);
            const yr = minMax(secondNumeric);
            const marks = firstNumeric.map((x, i) => (
                <circle key={i} cx={scaleXValue(x, xr.min, xr.max)} cy={scaleYValue(secondNumeric[i], yr.min, yr.max)} r="3.2" fill={PURPLE} opacity="0.22" />
            ));
            return { axes, marks };
        }
        const barValues = secondNumeric ?? firstNumeric;
        const br = minMax(barValues);
        const n = Math.max(1, barValues.length);
        const bw = plotW / n;
        const bars = barValues.map((v, i) => {
            const y = scaleYValue(v, br.min, br.max);
            return (
                <rect key={i} x={LEFT + i * bw + 1} y={y} width={Math.max(1, bw - 2)} height={TOP + plotH - y} fill={PURPLE} opacity="0.82" rx="1" />
            );
        });
        return { axes, marks: bars };
    }, [props.columnIndices, props.graphType, props.sheetData]);

    return (
        <svg className="suggested-viz-preview-plot" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden>
            {chart?.axes}
            {chart?.marks}
        </svg>
    );
};

export default SuggestedChartPreview;
