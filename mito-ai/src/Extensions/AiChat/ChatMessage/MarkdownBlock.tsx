/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';
import { createPortal } from 'react-dom';
import { Citation, CitationProps, CitationLine } from './Citation';
import { INotebookTracker } from '@jupyterlab/notebook';
import { scrollToCell, highlightCodeCell } from '../../../utils/notebook';
import { useCellOrder } from '../../../hooks/useCellOrder';
import '../../../../style/CellReference.css';

/**
 * React Portals in Markdown Rendering
 * -----------------------------------
 * 
 * This component uses React Portals to integrate interactive React components (Citations) 
 * into markdown content that's rendered by JupyterLab's renderer (non-React).
 * 
 * Why Portals?
 * ------------
 * 1. The markdown content is processed by JupyterLab's renderer which outputs regular DOM nodes,
 *    not React components.
 * 2. We need to insert interactive React components (Citations) at specific points within this
 *    rendered content.
 * 3. React's normal component hierarchy can't directly insert components into arbitrary DOM positions.
 * 
 * How Portals are Used Here:
 * -------------------------
 * 1. Citation data is extracted from the markdown and replaced with placeholder text ({{citation-n}})
 * 2. The markdown with placeholders is rendered to HTML using JupyterLab's renderer
 * 3. The rendered HTML is searched for placeholder text
 * 4. When placeholders are found, they're replaced with:
 *    - The surrounding text content
 *    - Empty <span> elements at the placeholder positions
 * 5. React Portals are created for each <span>, which render Citation components into those
 *    specific DOM locations
 * 
 * Benefits:
 * --------
 * - We can use a non-React renderer while still having interactive React components
 * - Citations appear exactly where they should in the rendered markdown
 * - React maintains control of the Citation components (event handling, updates, etc.)
 * - The approach is clean and maintainable compared to alternatives
 */

// Citation Portal component to render Citation into DOM
interface CitationPortalProps extends CitationProps {
    container: HTMLElement;
}

const CitationPortal: React.FC<CitationPortalProps> = ({ container, ...props }) => {
    return createPortal(<Citation {...props} />, container);
};

interface IMarkdownCodeProps {
    markdown: string;
    renderMimeRegistry: IRenderMimeRegistry;
    notebookTracker: INotebookTracker;
}

interface Citation {
    id: string;
    data: {
        citation_index: number;
        cell_id: string;
        line: CitationLine;
    };
}

interface CellRef {
    id: string;
    cellId: string;
}

const MarkdownBlock: React.FC<IMarkdownCodeProps> = ({ markdown, renderMimeRegistry, notebookTracker }) => {
    const [citationPortals, setCitationPortals] = useState<React.ReactElement[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Track cell order to update cell references when cells are reordered
    const cellOrder = useCellOrder(notebookTracker);
    
    // Create a serialized version of cell order for dependency tracking
    // This ensures re-renders when cells are reordered (even if count stays the same)
    const cellOrderKey = useMemo(() => {
        return Array.from(cellOrder.entries())
            .sort((a, b) => a[0].localeCompare(b[0])) // Sort by cellId for stable string
            .map(([cellId, cellNumber]) => `${cellId}:${cellNumber}`)
            .join(',');
    }, [cellOrder]);

    // Helper function to parse line numbers or ranges
    const parseLineNumber = (lineStr: string): CitationLine => {
        if (lineStr.includes('-')) {
            // Handle range format like "18-41"
            const parts = lineStr.split('-');
            const startStr = parts[0];
            const endStr = parts[1];
            
            if (!startStr || !endStr) {
                // Fallback to single line if split fails
                return parseInt(lineStr, 10);
            }
            
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            
            if (isNaN(start) || isNaN(end)) {
                // Fallback to single line if parsing fails
                return parseInt(lineStr, 10);
            }
            
            return { start, end };
        } else {
            // Handle single line number
            return parseInt(lineStr, 10);
        }
    };

    // Extract citations and cell references from the markdown, returning the markdown with 
    // placeholders and arrays of citation/cell reference objects.
    const extractCitationsAndCellRefs = useCallback((text: string): { 
        processedMarkdown: string; 
        citations: Citation[];
        cellRefs: CellRef[];
    } => {
        // Regex for citations: [MITO_CITATION:cell_id:line_number] or [MITO_CITATION:cell_id:start_line-end_line]
        const citationRegex = /\[MITO_CITATION:([^:]+):(\d+(?:-\d+)?)\]/g;
        // Regex for cell references: [MITO_CELL_REF:cell_id]
        const cellRefRegex = /\[MITO_CELL_REF:([^\]]+)\]/g;
        
        const citations: Citation[] = [];
        const cellRefs: CellRef[] = [];
        let citationCounter = 0;
        let cellRefCounter = 0;

        // First, replace citations with placeholders
        let processedMarkdown = text.replace(citationRegex, (match, cellId, lineStr) => {
            try {
                const id = `citation-${citationCounter++}`;
                const line = parseLineNumber(lineStr);
                citations.push({
                    id,
                    data: {
                        citation_index: citationCounter,
                        cell_id: cellId,
                        line: line
                    }
                });
                return `{{${id}}}`;
            } catch (e) {
                console.error("Failed to parse citation:", e);
                return match;
            }
        });

        // Then, replace cell references with placeholders
        processedMarkdown = processedMarkdown.replace(cellRefRegex, (match, cellId) => {
            const id = `cellref-${cellRefCounter++}`;
            cellRefs.push({
                id,
                cellId: cellId.trim()
            });
            return `{{${id}}}`;
        });

        return { processedMarkdown, citations, cellRefs };
    }, []);

    // Uses the Jupyter markdowm MimeRenderer to render the markdown content as normal HTML
    const renderMarkdownContent = useCallback(async (processedMarkdown: string): Promise<void> => {
        if (!processedMarkdown || !containerRef.current) return;

        try {
            const model = new MimeModel({
                data: { ['text/markdown']: processedMarkdown },
            });

            const renderer = renderMimeRegistry.createRenderer('text/markdown');
            await renderer.renderModel(model);

            // Clear previous content
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(renderer.node.cloneNode(true));
        } catch (error) {
            console.error("Error rendering markdown:", error);
        }
    }, [renderMimeRegistry]);


    // Replace the citation and cell reference placeholders with components in the DOM
    const createPortalsFromPlaceholders = useCallback((
        citations: Citation[], 
        cellRefs: CellRef[]
    ): React.ReactElement[] => {
        if (!containerRef.current || (citations.length === 0 && cellRefs.length === 0)) return [];

        const newPortals: React.ReactElement[] = [];

        // Create maps for faster lookup
        const citationMap = new Map(citations.map(citation => [`{{${citation.id}}}`, citation]));
        const cellRefMap = new Map(cellRefs.map(ref => [`{{${ref.id}}}`, ref]));

        // Find all text nodes that contain our placeholder like {{citation-id}}).
        // Since these placeholders exist within the text content (not as separate DOM elements):
        //  - Find all text nodes in the rendered markdown
        //  - Check each one to see if it contains any of your placeholders
        //  - Process those that do contain placeholders
        const textNodes: Text[] = [];
        const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT);

        let textNode;
        while ((textNode = walker.nextNode() as Text)) {
            textNodes.push(textNode);
        }

        // Process all text nodes in a single pass
        textNodes.forEach(node => {
            if (!node.nodeValue) return;

            // Check if this node contains any placeholders
            let containsPlaceholder = false;
            for (const placeholder of [...citationMap.keys(), ...cellRefMap.keys()]) {
                if (node.nodeValue.includes(placeholder)) {
                    containsPlaceholder = true;
                    break;
                }
            }

            if (!containsPlaceholder) return;

            // Create a regex to match all placeholders (citations and cell refs)
            const placeholderPattern = /\{\{(citation|cellref)-\d+\}\}/g;
            const matches = [...node.nodeValue.matchAll(placeholderPattern)];

            if (matches.length === 0) return;

            // Split the text by all placeholders and create a fragment
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            matches.forEach(match => {
                const placeholder = match[0];
                const startIndex = match.index!;

                // Add text before the placeholder
                if (startIndex > lastIndex) {
                    fragment.appendChild(
                        document.createTextNode(node.nodeValue!.substring(lastIndex, startIndex))
                    );
                }

                // Check if it's a citation or cell reference
                const citation = citationMap.get(placeholder);
                const cellRef = cellRefMap.get(placeholder);

                if (citation) {
                    // Create span for the citation
                    const span = document.createElement('span');
                    span.classList.add('citation-container');
                    span.dataset.citationId = citation.id;
                    fragment.appendChild(span);

                    // Create React portal for this span
                    newPortals.push(
                        <CitationPortal
                            key={citation.id + '-' + matches.indexOf(match)}
                            container={span}
                            citationIndex={citation.data.citation_index}
                            cellId={citation.data.cell_id}
                            line={citation.data.line}
                            notebookTracker={notebookTracker}
                        />
                    );
                } else if (cellRef) {
                    // Create clickable span for cell reference
                    const cellNumber = cellOrder.get(cellRef.cellId);
                    const isMissing = cellNumber === undefined;
                    const displayText = isMissing ? 'Cell' : `Cell ${cellNumber}`;
                    
                    const span = document.createElement('span');
                    span.className = isMissing ? 'cell-reference cell-reference-missing' : 'cell-reference';
                    span.textContent = displayText;
                    span.title = isMissing 
                        ? 'Cell not found (may have been deleted or is in a different notebook)'
                        : `Click to navigate to ${displayText}`;
                    
                    // Only add click handler if cell exists
                    if (!isMissing) {
                        span.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (notebookTracker.currentWidget) {
                                scrollToCell(notebookTracker.currentWidget, cellRef.cellId, undefined, 'center');
                                // Highlight the cell after scrolling
                                setTimeout(() => {
                                    highlightCodeCell(notebookTracker, cellRef.cellId);
                                }, 500);
                            }
                        });
                    }

                    fragment.appendChild(span);
                }

                lastIndex = startIndex + placeholder.length;
            });

            // Add any remaining text after the last placeholder
            if (lastIndex < node.nodeValue.length) {
                fragment.appendChild(
                    document.createTextNode(node.nodeValue.substring(lastIndex))
                );
            }

            // Replace the original text node with our fragment
            if (node.parentNode) {
                node.parentNode.replaceChild(fragment, node);
            }
        });

        return newPortals;
    }, [notebookTracker, cellOrder]);

    // Process everything in one effect, but with clear separation via helper functions
    // cellOrderKey triggers re-render when notebook loads or cells are reordered (fixes race condition on refresh)
    useEffect(() => {
        const processMarkdown = async (): Promise<void> => {
            // Step 1: Extract citations and cell references, get processed markdown
            const { processedMarkdown, citations, cellRefs } = extractCitationsAndCellRefs(markdown);

            // Step 2: Render markdown with placeholders
            await renderMarkdownContent(processedMarkdown);

            // Step 3: Create and insert portals for citations and cell references
            const portals = createPortalsFromPlaceholders(citations, cellRefs);
            setCitationPortals(portals);
        };

        void processMarkdown();
    }, [markdown, extractCitationsAndCellRefs, renderMarkdownContent, createPortalsFromPlaceholders, cellOrderKey]);

    return (
        <div ref={containerRef} className="markdown-block-with-citations">
            {citationPortals}
        </div>
    );
};

export default MarkdownBlock;