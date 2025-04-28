/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useRef } from 'react';
import { updateScrollMask, initScrollMask } from '../../../utils/scrollMask';

interface SuggestionOption {
    display: string;
    prompt: string;
}

interface ScrollableSuggestionsProps {
    options: SuggestionOption[];
    onSelectSuggestion: (prompt: string) => void;
}

const ScrollableSuggestions: React.FC<ScrollableSuggestionsProps> = ({ 
    options, 
    onSelectSuggestion 
}) => {
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Apply the scroll mask to the suggestions container when it mounts, updates, or is scrolled
    useEffect(() => {
        const suggestionsContainer = suggestionsRef.current;
        if (!suggestionsContainer) return;
        
        // Initialize the mask with a delay to ensure content is rendered
        initScrollMask(suggestionsContainer);
        
        // Update mask on scroll
        const handleScroll = () => {
            updateScrollMask(suggestionsContainer);
        };
        
        // Update mask on window resize
        const handleResize = () => {
            updateScrollMask(suggestionsContainer);
        };
        
        // Create a ResizeObserver to monitor changes to the container's parent
        const resizeObserver = new ResizeObserver(() => {
            updateScrollMask(suggestionsContainer);
        });
        
        // Observe the parent container that has the max-width constraint
        const parentContainer = suggestionsContainer.closest('.suggestions-container');
        if (parentContainer) {
            resizeObserver.observe(parentContainer);
        }
        
        suggestionsContainer.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        
        // Clean up the event listeners and observers on unmount
        return () => {
            suggestionsContainer.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
        };
    }, [options.length]); // Re-apply when options change

    return (
        <div className="chat-suggestions" ref={suggestionsRef}>
            {options.map((opt) => (
                <button
                    key={opt.display}
                    className="suggestion-box"
                    onClick={() => onSelectSuggestion(opt.prompt)}
                >
                    {opt.display}
                </button>
            ))}
        </div>
    );
};

export default ScrollableSuggestions; 