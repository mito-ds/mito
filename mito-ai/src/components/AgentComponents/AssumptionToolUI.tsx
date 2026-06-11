/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useRef, useState } from 'react';
import { classNames } from '../../utils/classNames';
import { AnalysisAssumptionOptions } from '../../websockets/completions/CompletionModels';
import { IStagedAssumptionChange } from '../../Extensions/AiChat/hooks/useStagedAssumptionChanges';
import ChevronIcon from '../../icons/ChevronIcon';
import EvidenceIcon from '../../icons/EvidenceIcon';
import '../../../style/AssumptionTool.css';
import '../../../style/AgentComponentHeader.css';

interface AssumptionToolUIProps {
    assumptions: AnalysisAssumptionOptions[];
    stagedAssumptionChanges?: IStagedAssumptionChange[];
    onAssumptionChange?: (originalSelected: string, newSelected: string) => void;
}

const CONTEXT_POPOVER_CLOSE_DELAY_MS = 100;

const ContextIndicator: React.FC<{ evidence: string }> = ({ evidence }) => {
    const [isOpen, setIsOpen] = useState(false);
    const closeTimeoutRef = useRef<number | null>(null);

    const handleMouseEnter = (): void => {
        if (closeTimeoutRef.current !== null) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsOpen(true);
    };

    const handleMouseLeave = (): void => {
        closeTimeoutRef.current = window.setTimeout(() => setIsOpen(false), CONTEXT_POPOVER_CLOSE_DELAY_MS);
    };

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current !== null) {
                window.clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            {/* Stop propagation so interacting with the context icon doesn't toggle the assumption dropdown */}
            <span
                className="assumption-evidence-container"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="agent-component-header-action-button"
                    title="Why did the agent make this assumption?"
                    data-testid="assumption-evidence-icon"
                >
                    <EvidenceIcon />
                </button>
            </span>
            {isOpen && (
                <div
                    className="assumption-evidence-popover"
                    data-testid="assumption-evidence-popover"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="assumption-evidence-popover-title">Context</div>
                    {evidence}
                </div>
            )}
        </>
    );
};

const AssumptionItem: React.FC<{
    assumption: AnalysisAssumptionOptions;
    stagedChange?: IStagedAssumptionChange;
    onAssumptionChange?: (originalSelected: string, newSelected: string) => void;
}> = ({ assumption, stagedChange, onAssumptionChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Track the user's choice locally so it persists after the staged change is
    // flushed and removed from the staged changes buffer.
    const [displayedSelection, setDisplayedSelection] = useState(assumption.selected);
    const containerRef = useRef<HTMLDivElement>(null);

    const hasAlternatives = assumption.options.length > 1 && onAssumptionChange !== undefined;
    const isPending = stagedChange !== undefined;

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const handleClickOutside = (event: MouseEvent): void => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="assumption-item" ref={containerRef}>
            <div
                className={classNames('assumption-item-statement-row', {
                    'assumption-statement-clickable': hasAlternatives,
                    'assumption-statement-pending': isPending,
                })}
                onClick={hasAlternatives ? () => setIsOpen(!isOpen) : undefined}
                title={hasAlternatives ? 'Click to see alternative assumptions' : undefined}
                data-testid={hasAlternatives ? 'assumption-statement-button' : undefined}
            >
                <span className="assumption-statement-text">{displayedSelection}</span>
                <span className="assumption-statement-actions">
                    {assumption.evidence && <ContextIndicator evidence={assumption.evidence} />}
                    {hasAlternatives && (
                        <ChevronIcon
                            direction={isOpen ? 'up' : 'down'}
                            className="agent-component-header-expand-icon"
                        />
                    )}
                </span>
            </div>
            {isPending && (
                <div className="assumption-pending-hint" data-testid="assumption-pending-hint">
                    Updated — will be sent to the agent
                </div>
            )}
            {isOpen && hasAlternatives && (
                <div className="assumption-options-list" data-testid="assumption-options-list">
                    {assumption.options.map((option, index) => (
                        <button
                            key={index}
                            className={classNames('assumption-option', { 'assumption-option-selected': option === displayedSelection })}
                            onClick={() => {
                                setIsOpen(false);
                                if (option !== displayedSelection && onAssumptionChange) {
                                    setDisplayedSelection(option);
                                    onAssumptionChange(assumption.selected, option);
                                }
                            }}
                        >
                            <span className="assumption-option-check">{option === displayedSelection ? '✓' : ''}</span>
                            <span>{option}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const AssumptionToolUI: React.FC<AssumptionToolUIProps> = ({
    assumptions,
    stagedAssumptionChanges,
    onAssumptionChange,
}): JSX.Element => {
    return (
        <div className={classNames('assumption-tool-container')}>
            {/* Assumption Header Label */}
            <div className="assumption-header-label">
                Assumption
            </div>

            <div className={classNames('assumption-content')}>
                {assumptions.map((assumption, index) => (
                    <AssumptionItem
                        key={index}
                        assumption={assumption}
                        stagedChange={stagedAssumptionChanges?.find(change => change.originalSelected === assumption.selected)}
                        onAssumptionChange={onAssumptionChange}
                    />
                ))}
            </div>
        </div>
    );
};

export default AssumptionToolUI;
