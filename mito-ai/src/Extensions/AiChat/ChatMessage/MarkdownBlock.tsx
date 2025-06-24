/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';
import { createPortal } from 'react-dom';
import { Citation, CitationProps, CitationLine } from './Citation';
import { INotebookTracker } from '@jupyterlab/notebook';

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

const MarkdownBlock: React.FC<IMarkdownCodeProps> = ({ markdown, renderMimeRegistry, notebookTracker }) => {
    const [citationPortals, setCitationPortals] = useState<React.ReactElement[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

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

    // Extract citations from the markdown, returning the markdown with the JSON citations replaced with 
    // citation placeholders {{${id}}} and an array of citation objects.
    const extractCitations = useCallback((text: string): { processedMarkdown: string; citations: Citation[] } => {
        // Updated regex to match both single lines and line ranges: [MITO_CITATION:cell_id:line_number] or [MITO_CITATION:cell_id:start_line-end_line]
        const citationRegex = /\[MITO_CITATION:([^:]+):(\d+(?:-\d+)?)\]/g;
        const citations: Citation[] = [];
        let counter = 0;

        // Replace each citation with a placeholder
        const processedMarkdown = text.replace(citationRegex, (match, cellId, lineStr) => {
            try {
                const id = `citation-${counter++}`;
                const line = parseLineNumber(lineStr);
                citations.push({
                    id,
                    data: {
                        citation_index: counter,
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

        return { processedMarkdown, citations };
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

    // Replace the citation placeholders with Citation Components in the DOM
    const createCitationPortals = useCallback((citations: Citation[]): React.ReactElement[] => {
        if (!containerRef.current || citations.length === 0) return [];

        const newPortals: React.ReactElement[] = [];

        // Create a map of placeholder to citation for faster lookup
        const citationMap = new Map(citations.map(citation => [`{{${citation.id}}}`, citation]));

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
            for (const placeholder of citationMap.keys()) {
                if (node.nodeValue.includes(placeholder)) {
                    containsPlaceholder = true;
                    break;
                }
            }

            if (!containsPlaceholder) return;

            // Create a regex to match all placeholders
            const placeholderPattern = /\{\{citation-\d+\}\}/g;
            const matches = [...node.nodeValue.matchAll(placeholderPattern)];

            if (matches.length === 0) return;

            // Split the text by all placeholders and create a fragment
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            matches.forEach(match => {
                const placeholder = match[0];
                const citation = citationMap.get(placeholder);
                if (!citation) return;

                const startIndex = match.index!;

                // Add text before the placeholder
                if (startIndex > lastIndex) {
                    fragment.appendChild(
                        document.createTextNode(node.nodeValue!.substring(lastIndex, startIndex))
                    );
                }

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
    }, []);

    // Process everything in one effect, but with clear separation via helper functions
    useEffect(() => {
        const processMarkdown = async (): Promise<void> => {
            // Step 1: Extract citations and get processed markdown
            const { processedMarkdown, citations } = extractCitations(markdown);

            // Step 2: Render markdown with placeholders
            await renderMarkdownContent(processedMarkdown);

            // Step 3: Create and insert citation portals
            const portals = createCitationPortals(citations);
            setCitationPortals(portals);
        };

        void processMarkdown();
    }, [markdown, extractCitations, renderMarkdownContent, createCitationPortals]);

    return (
        <div ref={containerRef} className="markdown-block-with-citations">
            {citationPortals}
        </div>
    );
};

export default MarkdownBlock;