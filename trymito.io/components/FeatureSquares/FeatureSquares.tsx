/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { classNames } from '../../utils/classNames';
import featureSquaresStyles from './FeatureSquares.module.css';
import pageStyles from '../../styles/Page.module.css';

interface FeatureCardData {
    id: string;
    title: string;
    description: string;
    isHero?: boolean;
}

/* Smooth line graph: upward trend with gentle curves (viewBox 0 0 100 100) */
const CHART_LINE_PATH =
    'M 0 88 C 18 88 22 72 38 68 C 54 64 58 76 72 58 C 84 42 90 32 100 22';
const CHART_AREA_PATH = CHART_LINE_PATH + ' L 100 100 L 0 100 Z';

const USER_MESSAGE = 'Create a candlestick chart of bitcoin transaction data';
const TYPEWRITER_MS = 35;
const ICON_DELAY_MS = 1600;
const STEP_PAUSE_MS = 300;

function JupyterAgentPreview({ isHovered }: { isHovered: boolean }) {
    const [typewriterLen, setTypewriterLen] = useState(0);
    const [visibleSteps, setVisibleSteps] = useState(0); // 0=none, 1=first step, 2=substep1, 3=substep2, 4=building, 5=looking, 6=thought, 7=adding labels
    const [iconResolved, setIconResolved] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false, 3: false, 4: false, 5: false });

    // Reset when hover ends so animation can replay
    useEffect(() => {
        if (!isHovered) {
            setTypewriterLen(0);
            setVisibleSteps(0);
            setIconResolved({ 0: false, 1: false, 2: false, 3: false, 4: false, 5: false });
        }
    }, [isHovered]);

    // Typewriter: advance one character on an interval while hovered
    useEffect(() => {
        if (!isHovered || typewriterLen >= USER_MESSAGE.length) return;
        const t = setInterval(() => {
            setTypewriterLen((n) => Math.min(n + 1, USER_MESSAGE.length));
        }, TYPEWRITER_MS);
        return () => clearInterval(t);
    }, [isHovered, typewriterLen]);

    // After typewriter completes, show first step with spinner then icon
    useEffect(() => {
        if (!isHovered || typewriterLen < USER_MESSAGE.length) return;
        if (visibleSteps < 1) setVisibleSteps(1);
        if (iconResolved[0]) return;
        const id = setTimeout(() => setIconResolved((r) => ({ ...r, 0: true })), ICON_DELAY_MS);
        return () => clearTimeout(id);
    }, [isHovered, typewriterLen, visibleSteps, iconResolved[0]]);

    // After first icon resolved, show first substep (Detected error) with spinner
    useEffect(() => {
        if (!iconResolved[0]) return;
        if (visibleSteps < 2) {
            const id = setTimeout(() => setVisibleSteps(2), STEP_PAUSE_MS);
            return () => clearTimeout(id);
        }
    }, [iconResolved[0], visibleSteps]);

    // Resolve icon for first substep (Detected error) after delay
    useEffect(() => {
        if (visibleSteps < 2 || iconResolved[1]) return;
        const id = setTimeout(() => setIconResolved((r) => ({ ...r, 1: true })), ICON_DELAY_MS);
        return () => clearTimeout(id);
    }, [visibleSteps, iconResolved[1]]);

    // After first substep icon resolved, show second substep (Using valid date range) with spinner
    useEffect(() => {
        if (!iconResolved[1]) return;
        if (visibleSteps < 3) {
            const id = setTimeout(() => setVisibleSteps(3), STEP_PAUSE_MS);
            return () => clearTimeout(id);
        }
    }, [iconResolved[1], visibleSteps]);

    // Resolve icon for second substep after delay
    useEffect(() => {
        if (visibleSteps < 3 || iconResolved[2]) return;
        const id = setTimeout(() => setIconResolved((r) => ({ ...r, 2: true })), ICON_DELAY_MS);
        return () => clearTimeout(id);
    }, [visibleSteps, iconResolved[2]]);

    // After second substep icon resolved, show Building candlestick step with spinner
    useEffect(() => {
        if (!iconResolved[2]) return;
        if (visibleSteps < 4) {
            const id = setTimeout(() => setVisibleSteps(4), STEP_PAUSE_MS);
            return () => clearTimeout(id);
        }
    }, [iconResolved[2], visibleSteps]);

    // Resolve icon for Building candlestick step after delay
    useEffect(() => {
        if (visibleSteps < 4 || iconResolved[3]) return;
        const id = setTimeout(() => setIconResolved((r) => ({ ...r, 3: true })), ICON_DELAY_MS);
        return () => clearTimeout(id);
    }, [visibleSteps, iconResolved[3]]);

    // After Building step icon resolved, show Looking at graph step with spinner
    useEffect(() => {
        if (!iconResolved[3]) return;
        if (visibleSteps < 5) {
            const id = setTimeout(() => setVisibleSteps(5), STEP_PAUSE_MS);
            return () => clearTimeout(id);
        }
    }, [iconResolved[3], visibleSteps]);

    // Resolve icon for Looking at graph step then show chart
    useEffect(() => {
        if (visibleSteps < 5 || iconResolved[4]) return;
        const id = setTimeout(() => setIconResolved((r) => ({ ...r, 4: true })), ICON_DELAY_MS);
        return () => clearTimeout(id);
    }, [visibleSteps, iconResolved[4]]);

    // After Looking at graph icon resolved, show thought process
    useEffect(() => {
        if (!iconResolved[4]) return;
        if (visibleSteps < 6) {
            const id = setTimeout(() => setVisibleSteps(6), STEP_PAUSE_MS);
            return () => clearTimeout(id);
        }
    }, [iconResolved[4], visibleSteps]);

    // After thought process, show "Adding chart labels" step
    useEffect(() => {
        if (visibleSteps < 6) return;
        if (visibleSteps < 7) {
            const id = setTimeout(() => setVisibleSteps(7), STEP_PAUSE_MS + 400);
            return () => clearTimeout(id);
        }
    }, [visibleSteps]);

    // Resolve "Adding chart labels" icon after delay, then chart v2 shows
    useEffect(() => {
        if (visibleSteps < 7 || iconResolved[5]) return;
        const id = setTimeout(() => setIconResolved((r) => ({ ...r, 5: true })), ICON_DELAY_MS);
        return () => clearTimeout(id);
    }, [visibleSteps, iconResolved[5]]);

    const showStep = (stepIndex: number) => visibleSteps > stepIndex;
    const showSpinner = (stepKey: number) => showStep(stepKey) && !iconResolved[stepKey];
    const showFullStatic = !isHovered;
    const displayMessageLen = showFullStatic ? USER_MESSAGE.length : typewriterLen;
    const displayStep = (i: number) => showFullStatic || showStep(i);
    const displayThought = showFullStatic || visibleSteps >= 6;
    const displayAddingLabelsStep = showFullStatic || visibleSteps >= 7;
    const displayChartV1 = showFullStatic ? false : (iconResolved[3] && !iconResolved[5]);
    const displayChartV2 = showFullStatic || iconResolved[5];
    const displayChart = displayChartV1 || displayChartV2;
    const displaySpinner = (key: number) => !showFullStatic && showSpinner(key);

    return (
        <div className={featureSquaresStyles.jupyter_agent_preview}>
            <div className={featureSquaresStyles.jupyter_agent_chat_column}>
                <div className={featureSquaresStyles.jupyter_agent_user_message_wrapper}>
                    <div className={featureSquaresStyles.jupyter_agent_user_message_label}>
                        <span className={featureSquaresStyles.jupyter_agent_user_message_icon} aria-hidden>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </span>
                        <span>You</span>
                    </div>
                    <div className={featureSquaresStyles.jupyter_agent_user_message}>
                        {USER_MESSAGE.slice(0, displayMessageLen)}
                        {!showFullStatic && typewriterLen < USER_MESSAGE.length && (
                            <span className={featureSquaresStyles.jupyter_agent_cursor} aria-hidden />
                        )}
                    </div>
                </div>
                <div className={featureSquaresStyles.jupyter_agent_step_group}>
                    <div className={classNames(featureSquaresStyles.jupyter_agent_step_expandable, featureSquaresStyles.jupyter_agent_step_animated, { [featureSquaresStyles.jupyter_agent_step_visible]: displayStep(0) })}>
                        <div className={featureSquaresStyles.jupyter_agent_step_row}>
                            <span className={featureSquaresStyles.jupyter_agent_step_icon} aria-hidden>
                                {displaySpinner(0) ? (
                                    <span className={featureSquaresStyles.jupyter_agent_spinner} aria-hidden>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                                    </span>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m7 7 5 5 5-5"/><path d="M4 14v2a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-2"/></svg>
                                )}
                            </span>
                            <span className={featureSquaresStyles.jupyter_agent_step_text}>querying bitcoin data from API</span>
                        </div>
                        <div className={classNames(featureSquaresStyles.jupyter_agent_step_inner, { [featureSquaresStyles.jupyter_agent_step_inner_expanded]: displayStep(1) })}>
                            <div className={featureSquaresStyles.jupyter_agent_step_inner_content}>
                                <div className={classNames(featureSquaresStyles.jupyter_agent_sub_step, featureSquaresStyles.jupyter_agent_step_animated, { [featureSquaresStyles.jupyter_agent_step_visible]: displayStep(1) })}>
                                    <span className={featureSquaresStyles.jupyter_agent_sub_step_icon} aria-hidden>
                                        {displaySpinner(1) ? (
                                            <span className={featureSquaresStyles.jupyter_agent_spinner} aria-hidden>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                                            </span>
                                        ) : (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                        )}
                                    </span>
                                    <span className={featureSquaresStyles.jupyter_agent_sub_step_text}>Detected error with API date range</span>
                                </div>
                                <div className={classNames(featureSquaresStyles.jupyter_agent_sub_step, featureSquaresStyles.jupyter_agent_step_animated, { [featureSquaresStyles.jupyter_agent_step_visible]: displayStep(2) })}>
                                    <span className={featureSquaresStyles.jupyter_agent_sub_step_icon} aria-hidden>
                                        {displaySpinner(2) ? (
                                            <span className={featureSquaresStyles.jupyter_agent_spinner} aria-hidden>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                                            </span>
                                        ) : (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                                        )}
                                    </span>
                                    <span className={featureSquaresStyles.jupyter_agent_sub_step_text}>Using valid date range for API call</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={classNames(featureSquaresStyles.jupyter_agent_step, featureSquaresStyles.jupyter_agent_step_animated, { [featureSquaresStyles.jupyter_agent_step_visible]: displayStep(3) })}>
                    <span className={featureSquaresStyles.jupyter_agent_step_icon} aria-hidden>
                        {displaySpinner(3) ? (
                            <span className={featureSquaresStyles.jupyter_agent_spinner} aria-hidden>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                            </span>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        )}
                    </span>
                    <span className={featureSquaresStyles.jupyter_agent_step_text}>Building candlestick chart</span>
                </div>
                <div className={classNames(featureSquaresStyles.jupyter_agent_step, featureSquaresStyles.jupyter_agent_step_animated, { [featureSquaresStyles.jupyter_agent_step_visible]: displayStep(4) })}>
                    <span className={featureSquaresStyles.jupyter_agent_step_icon} aria-hidden>
                        {displaySpinner(4) ? (
                            <span className={featureSquaresStyles.jupyter_agent_spinner} aria-hidden>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                            </span>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        )}
                    </span>
                    <span className={featureSquaresStyles.jupyter_agent_step_text}>Looking at graph to verify results</span>
                </div>
                <p className={classNames(featureSquaresStyles.jupyter_agent_thought, featureSquaresStyles.jupyter_agent_step_animated, { [featureSquaresStyles.jupyter_agent_step_visible]: displayThought })}>
                    Graph renders properly and accomplishes user&apos;s request, but is missing axis labels and title.
                </p>
                <div className={classNames(featureSquaresStyles.jupyter_agent_step, featureSquaresStyles.jupyter_agent_step_animated, { [featureSquaresStyles.jupyter_agent_step_visible]: displayAddingLabelsStep })}>
                    <span className={featureSquaresStyles.jupyter_agent_step_icon} aria-hidden>
                        {displaySpinner(5) ? (
                            <span className={featureSquaresStyles.jupyter_agent_spinner} aria-hidden>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                            </span>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                    </span>
                    <span className={featureSquaresStyles.jupyter_agent_step_text}>Adding chart labels</span>
                </div>
            </div>
            <div className={classNames(featureSquaresStyles.jupyter_agent_chart, featureSquaresStyles.jupyter_agent_chart_animated, { [featureSquaresStyles.jupyter_agent_chart_visible]: displayChart })} aria-hidden>
                <div className={featureSquaresStyles.jupyter_agent_chart_svg_wrap}>
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={featureSquaresStyles.jupyter_agent_candlestick_svg}>
                    {(() => {
                        const n = 72;
                        const spacing = 100 / n;
                        const bodyW = 0.6;
                        const smooth = (arr: number[], w: number) => {
                            const out: number[] = [];
                            for (let i = 0; i < arr.length; i++) {
                                let s = 0; let cnt = 0;
                                for (let j = Math.max(0, i - w); j <= Math.min(arr.length - 1, i + w); j++) { s += arr[j]; cnt++; }
                                out.push(s / cnt);
                            }
                            return out;
                        };
                        // Volatility: high at start, squeezes tight in middle, slightly up at end
                        const volatility = (t: number) => {
                            const squeeze = 1 - Math.exp(-((t - 0.35) ** 2) / 0.015);
                            return 0.15 + 0.85 * (t < 0.2 ? 1 : t < 0.5 ? squeeze : 0.2 + 0.15 * Math.sin((t - 0.5) * 10));
                        };
                        // Price: starts high (small y), drops dramatically, then stabilizes low (large y)
                        const ys: number[] = [];
                        for (let i = 0; i <= n; i++) {
                            const t = i / n;
                            const trend = 8 + 24 * (1 - Math.exp(-t * 3.5));
                            const noise = volatility(t) * 3 * Math.sin(t * 25 + i * 0.5);
                            ys.push(Math.max(4, Math.min(36, trend + noise)));
                        }
                        const candles = Array.from({ length: n }, (_, i) => {
                            const t = i / n;
                            const vol = volatility(t);
                            const x = (i + 0.5) * spacing;
                            const open = ys[i];
                            const close = ys[Math.min(i + 1, n)];
                            const bodyTop = Math.min(open, close);
                            const bodyBottom = Math.max(open, close);
                            const bodyH = Math.max(bodyBottom - bodyTop, 0.3 + vol * 0.8);
                            const bull = close <= open; // price going down = bearish (red), up = bullish (green)
                            const wickScale = 0.5 + vol * 2.5;
                            const wickUp = wickScale * (0.6 + (i % 4) * 0.15);
                            const wickDn = wickScale * (0.6 + (i % 3) * 0.2);
                            const high = Math.min(open, close) - wickUp;
                            const low = Math.max(open, close) + wickDn;
                            return { x, high, low, bodyTop, bodyBottom, bodyH, bull, vol };
                        });
                        // Band: smooth envelope around candles, always encompassing all wicks (y: smaller = higher price).
                        // Extra margin at start and end so the band is visibly larger there (Bollinger-style).
                        const rawUpper = candles.map((c) => c.high - c.vol * 1.5);
                        const rawLower = candles.map((c) => c.low + c.vol * 1.5);
                        let upperYs = smooth(rawUpper, 4);
                        let lowerYs = smooth(rawLower, 4);
                        upperYs = upperYs.map((y, i) => Math.min(y, candles[i].high));
                        lowerYs = lowerYs.map((y, i) => Math.max(y, candles[i].low));
                        const edgeMargin = (i: number) => {
                            const t = i / (n - 1);
                            const fromStart = Math.exp(-t * 4);
                            const fromEnd = Math.exp(-(1 - t) * 4);
                            return 2.2 * (fromStart + fromEnd);
                        };
                        upperYs = upperYs.map((y, i) => y - edgeMargin(i));
                        lowerYs = lowerYs.map((y, i) => y + edgeMargin(i));
                        const bandPath = `M${candles.map((c, i) => `${c.x},${upperYs[i]}`).join(' L')} L${candles[n - 1].x},${lowerYs[n - 1]} L${[...candles].reverse().map((c, i) => `${c.x},${lowerYs[n - 1 - i]}`).join(' L')} Z`;
                        // Midline: smoothed price
                        const midYs = smooth(candles.map((c) => (c.bodyTop + c.bodyBottom) / 2), 5);
                        const midLinePath = candles.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${midYs[i]}`).join(' ');
                        return (
                            <>
                                <path d={bandPath} className={featureSquaresStyles.candle_bollinger_band} />
                                <path d={midLinePath} fill="none" stroke="currentColor" strokeWidth="0.4" className={featureSquaresStyles.candle_bollinger_mid} />
                                {candles.map((c, i) => (
                                    <g key={i}>
                                        <line x1={c.x} y1={c.high} x2={c.x} y2={c.low} stroke="currentColor" strokeWidth="0.3" className={featureSquaresStyles.candle_wick} />
                                        <rect x={c.x - bodyW / 2} y={c.bodyTop} width={bodyW} height={c.bodyH} className={c.bull ? featureSquaresStyles.candle_body_bull : featureSquaresStyles.candle_body_bear} />
                                    </g>
                                ))}
                            </>
                        );
                    })()}
                </svg>
                </div>
                {displayChartV2 && (
                    <div className={featureSquaresStyles.jupyter_agent_chart_labels}>
                        <span className={featureSquaresStyles.jupyter_agent_chart_title}>Bitcoin — Bollinger Bands</span>
                        <span className={featureSquaresStyles.jupyter_agent_chart_axis_labels}>
                            <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

const SMART_DEBUG_PHASE = {
    IDLE: 0,
    MOUSE_MOVE: 1,
    CLICK: 2,
    CODE_REWRITE: 3,
    LOADING: 4,
    RESOLVED: 5,
} as const;

function SmartDebuggingPreview({ isHovered }: { isHovered: boolean }) {
    const [phase, setPhase] = useState(0);

    // Advance through phases when hovered; reset when not
    useEffect(() => {
        if (!isHovered) {
            setPhase(SMART_DEBUG_PHASE.IDLE);
            return;
        }
        const t1 = setTimeout(() => setPhase(SMART_DEBUG_PHASE.MOUSE_MOVE), 350);
        const t2 = setTimeout(() => setPhase(SMART_DEBUG_PHASE.CLICK), 700);
        const t3 = setTimeout(() => setPhase(SMART_DEBUG_PHASE.CODE_REWRITE), 950);
        const t4 = setTimeout(() => setPhase(SMART_DEBUG_PHASE.LOADING), 1100);
        const t5 = setTimeout(() => setPhase(SMART_DEBUG_PHASE.RESOLVED), 2600);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
        };
    }, [isHovered]);

    const showErrorLine = phase < SMART_DEBUG_PHASE.CODE_REWRITE;
    const showFixedLine = phase >= SMART_DEBUG_PHASE.CODE_REWRITE;
    const showMouse = phase >= SMART_DEBUG_PHASE.MOUSE_MOVE;
    const showClick = phase >= SMART_DEBUG_PHASE.CLICK;
    const buttonLoading = phase === SMART_DEBUG_PHASE.LOADING;
    const buttonResolved = phase >= SMART_DEBUG_PHASE.RESOLVED;

    return (
        <div className={featureSquaresStyles.smart_debugging_preview}>
            <div className={featureSquaresStyles.smart_debugging_container}>
                {/* Editor window with header */}
                <div className={featureSquaresStyles.smart_debugging_window}>
                    <div className={featureSquaresStyles.smart_debugging_window_header}>
                        <div className={featureSquaresStyles.smart_debugging_window_dots}>
                            <span /><span /><span />
                        </div>
                        <span className={featureSquaresStyles.smart_debugging_window_title}>analysis.ipynb</span>
                    </div>
                    <div className={featureSquaresStyles.smart_debugging_code_block}>
                        <div className={featureSquaresStyles.smart_debugging_code_line}>
                            <span className={featureSquaresStyles.smart_debugging_line_number}>1</span>
                            <code>import pandas as pd</code>
                        </div>
                        <div className={featureSquaresStyles.smart_debugging_code_line}>
                            <span className={featureSquaresStyles.smart_debugging_line_number}>2</span>
                            {showErrorLine && (
                                <span className={featureSquaresStyles.smart_debugging_line_with_error}>
                                    <code>df = pandas.read_csv(&apos;cars.csv&apos;)</code>
                                    <span className={featureSquaresStyles.smart_debugging_squiggly} aria-hidden />
                                </span>
                            )}
                            {showFixedLine && (
                                <code className={featureSquaresStyles.smart_debugging_line_fixed}>
                                    df = pd.read_csv(&apos;cars.csv&apos;)
                                </code>
                            )}
                        </div>
                        <div className={featureSquaresStyles.smart_debugging_code_line}>
                            <span className={featureSquaresStyles.smart_debugging_line_number}>3</span>
                            <code>df = df[df[&apos;type&apos;] == &apos;CRV&apos;]</code>
                        </div>
                        <div className={featureSquaresStyles.smart_debugging_code_line}>
                            <span className={featureSquaresStyles.smart_debugging_line_number}>4</span>
                            <code>df.head()</code>
                        </div>
                    </div>
                </div>
                {/* Fix Error button at bottom */}
                <div className={featureSquaresStyles.smart_debugging_button_wrapper}>
                    <button
                        type="button"
                        className={classNames(
                            featureSquaresStyles.smart_debugging_button,
                            { [featureSquaresStyles.smart_debugging_button_clicked]: showClick && !buttonResolved },
                            { [featureSquaresStyles.smart_debugging_button_loading]: buttonLoading },
                            { [featureSquaresStyles.smart_debugging_button_resolved]: buttonResolved }
                        )}
                        aria-label={buttonResolved ? 'Error resolved' : 'Fix error'}
                    >
                        {buttonLoading && (
                            <span className={featureSquaresStyles.smart_debugging_button_spinner} aria-hidden>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                            </span>
                        )}
                        {!buttonLoading && !buttonResolved && 'Fix Error'}
                        {buttonResolved && (
                            <>
                                <span className={featureSquaresStyles.smart_debugging_button_check} aria-hidden>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                                Error Resolved
                            </>
                        )}
                    </button>
                </div>
                {/* Cursor (same design as Chart Wizard) that moves to button and clicks */}
                {showMouse && (
                    <div
                        className={classNames(
                            featureSquaresStyles.smart_debugging_cursor,
                            { [featureSquaresStyles.smart_debugging_cursor_clicked]: showClick }
                        )}
                        aria-hidden
                    >
                        <svg
                            viewBox="0 0 24 24"
                            width={20}
                            height={20}
                            className={featureSquaresStyles.smart_debugging_cursor_icon}
                        >
                            <path
                                fill="currentColor"
                                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
                            />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}

function ChartWizardPreview({ isHovered }: { isHovered: boolean }) {
    return (
        <div className={featureSquaresStyles.chart_wizard_preview}>
            <div className={featureSquaresStyles.chart_wizard_graph}>
                {/* Axes */}
                <div className={featureSquaresStyles.chart_wizard_axes} aria-hidden />
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className={featureSquaresStyles.chart_wizard_svg}
                    aria-hidden
                >
                    {/* Area fill under the line */}
                    <path
                        d={CHART_AREA_PATH}
                        className={classNames(
                            featureSquaresStyles.chart_wizard_area,
                            { [featureSquaresStyles.chart_wizard_area_active]: isHovered }
                        )}
                    />
                    {/* Line stroke - smooth curve */}
                    <path
                        d={CHART_LINE_PATH}
                        className={classNames(
                            featureSquaresStyles.chart_wizard_line,
                            { [featureSquaresStyles.chart_wizard_line_active]: isHovered }
                        )}
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <div className={featureSquaresStyles.chart_wizard_sliders}>
                <div className={featureSquaresStyles.chart_wizard_slider}>
                    <div
                        className={classNames(
                            featureSquaresStyles.chart_wizard_slider_track,
                            { [featureSquaresStyles.chart_wizard_slider_track_active]: isHovered }
                        )}
                    >
                        <div
                            className={classNames(
                                featureSquaresStyles.chart_wizard_slider_thumb,
                                { [featureSquaresStyles.chart_wizard_slider_thumb_active]: isHovered }
                            )}
                        />
                    </div>
                </div>
                <div className={featureSquaresStyles.chart_wizard_slider}>
                    <div className={featureSquaresStyles.chart_wizard_slider_track}>
                        <div className={featureSquaresStyles.chart_wizard_slider_thumb} />
                    </div>
                </div>
                <div className={featureSquaresStyles.chart_wizard_slider}>
                    <div className={featureSquaresStyles.chart_wizard_slider_track}>
                        <div className={featureSquaresStyles.chart_wizard_slider_thumb} />
                    </div>
                </div>
            </div>
            {isHovered && (
                <div className={featureSquaresStyles.chart_wizard_cursor} aria-hidden>
                    <svg
                        viewBox="0 0 24 24"
                        width={20}
                        height={20}
                        className={featureSquaresStyles.chart_wizard_cursor_icon}
                    >
                        <path
                            fill="currentColor"
                            d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
                        />
                    </svg>
                </div>
            )}
        </div>
    );
}

function DatabaseConnectionsPreview({ isHovered }: { isHovered: boolean }) {
    /* Database node positions (x coordinates as percentages) */
    const dbNodes = [8, 22, 36, 50, 64, 78, 92];
    /* Multiple particles per line for continuous flow */
    const particlesPerLine = 3;

    return (
        <div className={featureSquaresStyles.db_connections_preview}>
            {/* UI Window representation */}
            <div className={featureSquaresStyles.db_connections_window}>
                <div className={featureSquaresStyles.db_connections_window_header}>
                    <div className={featureSquaresStyles.db_connections_window_dots}>
                        <span />
                        <span />
                        <span />
                    </div>
                </div>
                <div className={featureSquaresStyles.db_connections_window_content}>
                    {/* Table rows */}
                    <div className={featureSquaresStyles.db_connections_row}>
                        <span className={featureSquaresStyles.db_connections_cell_short} />
                        <span className={featureSquaresStyles.db_connections_cell_long} />
                        <span className={featureSquaresStyles.db_connections_cell_medium} />
                    </div>
                    <div className={featureSquaresStyles.db_connections_row}>
                        <span className={featureSquaresStyles.db_connections_cell_short} />
                        <span className={featureSquaresStyles.db_connections_cell_medium} />
                        <span className={featureSquaresStyles.db_connections_cell_long} />
                    </div>
                    <div className={featureSquaresStyles.db_connections_row}>
                        <span className={featureSquaresStyles.db_connections_cell_medium} />
                        <span className={featureSquaresStyles.db_connections_cell_short} />
                        <span className={featureSquaresStyles.db_connections_cell_long} />
                    </div>
                </div>
            </div>

            {/* SVG Connection lines with animated particles */}
            <svg
                viewBox="0 0 100 50"
                preserveAspectRatio="none"
                className={featureSquaresStyles.db_connections_svg}
                aria-hidden
            >
                <defs>
                    {/* Define paths for motion */}
                    {dbNodes.map((x, i) => (
                        <path
                            key={`path-${i}`}
                            id={`dbPath${i}`}
                            d={`M ${x} 50 Q 50 25, 50 0`}
                            fill="none"
                        />
                    ))}
                </defs>
                {/* Static connection lines */}
                {dbNodes.map((x, i) => (
                    <path
                        key={i}
                        d={`M 50 0 Q 50 25, ${x} 50`}
                        className={classNames(
                            featureSquaresStyles.db_connections_line,
                            { [featureSquaresStyles.db_connections_line_active]: isHovered }
                        )}
                        fill="none"
                        strokeWidth="0.8"
                    />
                ))}
                {/* Animated particles that flow up the paths */}
                {isHovered && dbNodes.map((_, i) => (
                    Array.from({ length: particlesPerLine }).map((__, p) => (
                        <circle
                            key={`particle-${i}-${p}`}
                            r="1.5"
                            className={featureSquaresStyles.db_connections_particle}
                            style={{ animationDelay: `${i * 0.08 + p * 0.5}s` }}
                        >
                            <animateMotion
                                dur="1.2s"
                                repeatCount="indefinite"
                                begin={`${i * 0.08 + p * 0.4}s`}
                            >
                                <mpath href={`#dbPath${i}`} />
                            </animateMotion>
                        </circle>
                    ))
                ))}
            </svg>

            {/* Database nodes */}
            <div className={featureSquaresStyles.db_connections_nodes}>
                {dbNodes.map((x, i) => (
                    <div
                        key={i}
                        className={classNames(
                            featureSquaresStyles.db_connections_node,
                            { [featureSquaresStyles.db_connections_node_active]: isHovered }
                        )}
                        style={{
                            left: `${x}%`,
                        }}
                    >
                        <span
                            className={classNames(
                                featureSquaresStyles.db_connections_node_dot,
                                { [featureSquaresStyles.db_connections_node_dot_active]: isHovered }
                            )}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function SpreadsheetEditorPreview({ isHovered }: { isHovered: boolean }) {
    /* Spreadsheet data - header + 3 rows with extra columns for edge cutoff effect */
    const headers = ['ID', 'Revenue', 'Cost', 'Profit', 'Margin', 'YoY'];
    const rows = [
        ['001', '$5,000', '$3,200', '$1,800', '36%', '+12%'],
        ['002', '$4,200', '$2,800', '$1,400', '33%', '+8%'],
        ['003', '$6,100', '$3,900', '$2,200', '36%', '+15%'],
    ];

    return (
        <div className={featureSquaresStyles.spreadsheet_preview}>
            {/* Spreadsheet with formula bar */}
            <div className={featureSquaresStyles.spreadsheet_container}>
                {/* Formula bar */}
                <div
                    className={classNames(
                        featureSquaresStyles.spreadsheet_formula_bar,
                        { [featureSquaresStyles.spreadsheet_formula_bar_active]: isHovered }
                    )}
                >
                    <span className={featureSquaresStyles.spreadsheet_formula_label}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fx</span>
                    <span
                        className={classNames(
                            featureSquaresStyles.spreadsheet_formula_text,
                            { [featureSquaresStyles.spreadsheet_formula_text_active]: isHovered }
                        )}
                    >
                        {isHovered ? '=Revenue-Cost' : ''}
                    </span>
                </div>

                {/* Spreadsheet grid */}
                <div className={featureSquaresStyles.spreadsheet_grid}>
                    {/* Header row */}
                    <div className={featureSquaresStyles.spreadsheet_row_header}>
                        {headers.map((h, i) => (
                            <span
                                key={i}
                                className={classNames(
                                    featureSquaresStyles.spreadsheet_cell_header,
                                    { [featureSquaresStyles.spreadsheet_cell_header_highlight]: isHovered && i === 3 }
                                )}
                            >
                                {h}
                            </span>
                        ))}
                    </div>
                    {/* Data rows */}
                    {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className={featureSquaresStyles.spreadsheet_row}>
                            {row.map((cell, colIdx) => (
                                <span
                                    key={colIdx}
                                    className={classNames(
                                        featureSquaresStyles.spreadsheet_cell,
                                        {
                                            [featureSquaresStyles.spreadsheet_cell_highlight]:
                                                isHovered && colIdx === 3,
                                        }
                                    )}
                                >
                                    {cell}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Arrow indicator */}
            <div
                className={classNames(
                    featureSquaresStyles.spreadsheet_arrow,
                    { [featureSquaresStyles.spreadsheet_arrow_active]: isHovered }
                )}
            >
                ↓
            </div>

            {/* Python code - single line */}
            <div
                className={classNames(
                    featureSquaresStyles.spreadsheet_code,
                    { [featureSquaresStyles.spreadsheet_code_active]: isHovered }
                )}
            >
                <span className={featureSquaresStyles.code_keyword}>df</span>
                <span className={featureSquaresStyles.code_bracket}>[</span>
                <span className={featureSquaresStyles.code_string}>&apos;Profit&apos;</span>
                <span className={featureSquaresStyles.code_bracket}>]</span>
                <span className={featureSquaresStyles.code_operator}> = </span>
                <span className={featureSquaresStyles.code_keyword}>df</span>
                <span className={featureSquaresStyles.code_bracket}>[</span>
                <span className={featureSquaresStyles.code_string}>&apos;Revenue&apos;</span>
                <span className={featureSquaresStyles.code_bracket}>]</span>
                <span className={featureSquaresStyles.code_operator}> - </span>
                <span className={featureSquaresStyles.code_keyword}>df</span>
                <span className={featureSquaresStyles.code_bracket}>[</span>
                <span className={featureSquaresStyles.code_string}>&apos;Cost&apos;</span>
                <span className={featureSquaresStyles.code_bracket}>]</span>
            </div>
        </div>
    );
}

function AppModePreview({ isHovered }: { isHovered: boolean }) {
    /* Bar chart data - heights as percentages */
    const barHeights = [45, 65, 55, 80, 70, 90, 75];
    
    const previewRef = useRef<HTMLDivElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [isDropped, setIsDropped] = useState(false);

    // Track mouse position relative to the preview container
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!previewRef.current || isDropped) return;
        const rect = previewRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });

        // Check if cursor is over the drop zone
        if (dropZoneRef.current) {
            const dropRect = dropZoneRef.current.getBoundingClientRect();
            const isOverDropZone = 
                e.clientX >= dropRect.left &&
                e.clientX <= dropRect.right &&
                e.clientY >= dropRect.top &&
                e.clientY <= dropRect.bottom;
            
            if (isOverDropZone && !isDropped) {
                setIsDropped(true);
            }
        }
    }, [isDropped]);

    // Reset state when mouse leaves
    useEffect(() => {
        if (!isHovered) {
            setMousePos(null);
            setIsDropped(false);
        }
    }, [isHovered]);

    const showDraggingChart = isHovered && mousePos && !isDropped;

    return (
        <div 
            ref={previewRef}
            className={featureSquaresStyles.app_mode_preview}
            onMouseMove={handleMouseMove}
        >
            {/* App Window */}
            <div className={featureSquaresStyles.app_mode_window}>
                {/* Window header with traffic lights */}
                <div className={featureSquaresStyles.app_mode_window_header}>
                    <div className={featureSquaresStyles.app_mode_window_dots}>
                        <span />
                        <span />
                        <span />
                    </div>
                </div>

                {/* Window content - dashboard layout */}
                <div className={featureSquaresStyles.app_mode_window_content}>
                    {/* Top section - full-width text placeholders that shift when chart drops */}
                    <div
                        className={classNames(
                            featureSquaresStyles.app_mode_content_row,
                            featureSquaresStyles.app_mode_content_row_top,
                            { [featureSquaresStyles.app_mode_content_row_shifted]: isDropped }
                        )}
                    >
                        <div className={featureSquaresStyles.app_mode_placeholder_block}>
                            <span className={featureSquaresStyles.app_mode_placeholder_line_full} />
                            <span className={featureSquaresStyles.app_mode_placeholder_line_full} style={{ width: '85%' }} />
                            <span className={featureSquaresStyles.app_mode_placeholder_line_full} style={{ width: '70%' }} />
                            <span className={featureSquaresStyles.app_mode_placeholder_line_full} />
                        </div>
                    </div>

                    {/* Drop zone - where the chart will land */}
                    <div
                        ref={dropZoneRef}
                        className={classNames(
                            featureSquaresStyles.app_mode_drop_zone,
                            { [featureSquaresStyles.app_mode_drop_zone_active]: isHovered && !isDropped },
                            { [featureSquaresStyles.app_mode_drop_zone_dropped]: isDropped }
                        )}
                    >
                        {/* Chart that appears when dropped */}
                        <div
                            className={classNames(
                                featureSquaresStyles.app_mode_chart,
                                { [featureSquaresStyles.app_mode_chart_dropped]: isDropped }
                            )}
                        >
                            <div className={featureSquaresStyles.app_mode_chart_bars}>
                                {barHeights.map((height, i) => (
                                    <div
                                        key={i}
                                        className={classNames(
                                            featureSquaresStyles.app_mode_chart_bar,
                                            { [featureSquaresStyles.app_mode_chart_bar_active]: isDropped }
                                        )}
                                        style={{
                                            height: `${height}%`,
                                            transitionDelay: `${0.1 + i * 0.05}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom section - full-width placeholders, shifts down to make space */}
                    <div
                        className={classNames(
                            featureSquaresStyles.app_mode_content_row,
                            featureSquaresStyles.app_mode_content_row_bottom,
                            { [featureSquaresStyles.app_mode_content_row_shifted_down]: isDropped }
                        )}
                    >
                        <div className={featureSquaresStyles.app_mode_placeholder_block}>
                            <span className={featureSquaresStyles.app_mode_placeholder_line_full} />
                            <span className={featureSquaresStyles.app_mode_placeholder_line_full} style={{ width: '90%' }} />
                            <span className={featureSquaresStyles.app_mode_placeholder_line_full} />
                            <span className={featureSquaresStyles.app_mode_placeholder_line_full} style={{ width: '60%' }} />
                            <span className={featureSquaresStyles.app_mode_placeholder_line_full} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dragging chart that follows the cursor */}
            {showDraggingChart && (
                <div 
                    className={featureSquaresStyles.app_mode_cursor_container}
                    style={{
                        left: mousePos.x,
                        top: mousePos.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {/* Small chart being dragged */}
                    <div className={featureSquaresStyles.app_mode_dragging_chart}>
                        <div className={featureSquaresStyles.app_mode_dragging_chart_bars}>
                            {barHeights.slice(0, 5).map((height, i) => (
                                <div
                                    key={i}
                                    className={featureSquaresStyles.app_mode_dragging_bar}
                                    style={{ height: `${height}%` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const FEATURES: FeatureCardData[] = [
    {
        id: 'jupyter-agent',
        title: 'Jupyter Agent',
        description: "Your coding assistant that understands your data, and updates your notebook for you. Like ChatGPT in Jupyter.",
        isHero: true
    },
    {
        id: 'spreadsheet-editor',
        title: 'Excel-like Spreadsheet',
        description: 'Edit your data with formulas, pivots, and filter just like you do in Excel.'
    },
    {
        id: 'chart-wizard',
        title: 'Chart Wizard',
        description: 'Point-and-click charts, exported as Python.'
    },
    {
        id: 'smart-debugging',
        title: 'Auto Error Correction',
        description: 'One-click fix and explanation for any error.'
    },
    {
        id: 'database-connections',
        title: 'Database Connections',
        description: 'Connect to your databases and run SQL queries.'
    },
    {
        id: 'app-mode',
        title: 'App Builder',
        description: 'Convert any notebook into a Streamlit app. Share insights with your team.'
    }
];

function FeatureCard({ feature }: { feature: FeatureCardData }) {
    const [isHovered, setIsHovered] = useState(false);
    const isChartWizard = feature.id === 'chart-wizard';
    const isSmartDebugging = feature.id === 'smart-debugging';
    const isDatabaseConnections = feature.id === 'database-connections';
    const isSpreadsheetEditor = feature.id === 'spreadsheet-editor';
    const isAppMode = feature.id === 'app-mode';
    const isJupyterAgent = feature.id === 'jupyter-agent';


    const handlePlay = useCallback(() => {
        if (isChartWizard || isSmartDebugging || isDatabaseConnections || isSpreadsheetEditor || isAppMode || isJupyterAgent) {
            setIsHovered(true);
            return;
        }
    }, [isChartWizard, isSmartDebugging, isDatabaseConnections, isSpreadsheetEditor, isAppMode, isJupyterAgent]);

    const handlePause = useCallback(() => {
        if (isChartWizard || isSmartDebugging || isDatabaseConnections || isSpreadsheetEditor || isAppMode || isJupyterAgent) {
            setIsHovered(false);
            return;
        }
    }, [isChartWizard, isSmartDebugging, isDatabaseConnections, isSpreadsheetEditor, isAppMode, isJupyterAgent]);

    const cardClassName = classNames(
        featureSquaresStyles.feature_card,
        { [featureSquaresStyles.feature_card_hero]: feature.isHero },
        { [featureSquaresStyles.feature_card_chart_wizard]: isChartWizard },
        { [featureSquaresStyles.feature_card_smart_debugging]: isSmartDebugging },
        { [featureSquaresStyles.feature_card_database_connections]: isDatabaseConnections },
        { [featureSquaresStyles.feature_card_spreadsheet_editor]: isSpreadsheetEditor },
        { [featureSquaresStyles.feature_card_app_mode]: isAppMode },
        { [featureSquaresStyles.feature_card_jupyter_agent]: isJupyterAgent }
    );

    return (
        <div
            className={cardClassName}
            onMouseEnter={handlePlay}
            onMouseLeave={handlePause}
        >
            <div className={featureSquaresStyles.feature_card_header}>
                <div className={featureSquaresStyles.feature_card_text_container}>
                    <h2>{feature.title}</h2>
                    <p className={featureSquaresStyles.feature_card_description}>{feature.description}</p>
                </div>
            </div>
            <div className={featureSquaresStyles.feature_card_image_container}>
                {isJupyterAgent ? (
                    <JupyterAgentPreview isHovered={isHovered} />
                ) : isSmartDebugging ? (
                    <SmartDebuggingPreview isHovered={isHovered} />
                ) : isChartWizard ? (
                    <ChartWizardPreview isHovered={isHovered} />
                ) : isDatabaseConnections ? (
                    <DatabaseConnectionsPreview isHovered={isHovered} />
                ) : isSpreadsheetEditor ? (
                    <SpreadsheetEditorPreview isHovered={isHovered} />
                ) : isAppMode ? (
                    <AppModePreview isHovered={isHovered} />
                ) : null}
            </div>
        </div>
    );
}

const FEATURE_SQUARES_HEADING = 'The complete toolkit for turning data into insights';

const FeatureSquares = (): JSX.Element => {
    return (
        <div className={featureSquaresStyles.feature_squares_wrapper}>
            <h2 className={classNames(featureSquaresStyles.feature_squares_heading)}>
                {FEATURE_SQUARES_HEADING}
            </h2>
            <div className={featureSquaresStyles.feature_squares_container}>
                {FEATURES.map((feature) => (
                    <FeatureCard key={feature.id} feature={feature} />
                ))}
            </div>
            <p className={featureSquaresStyles.feature_squares_tagline}>
                Upgrade your Jupyter workflow with <Link href="/downloads"><a className={featureSquaresStyles.pip_install_link}>one pip install</a></Link>
            </p>
        </div>
    );
};

export default FeatureSquares;
