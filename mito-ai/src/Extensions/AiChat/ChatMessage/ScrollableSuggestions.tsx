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

const DEFAULT_SUGGESTION_OPTIONS: SuggestionOption[] = [
    {
        display: "Plot Meta Acquisitions",
        prompt: "Build an annotated graph of how Meta's acquisitions of Instagram, Whatsapp, and Giphy affected the Meta stock price. Use the data from https://raw.githubusercontent.com/mito-ds/mito/refs/heads/dev/jupyterhub/meta_stock_prices.csv"
    },
    {
        display: "Explore EV Registrations",
        prompt: "Visualize the top 20 electric vehicle (EV) makes and models registered in Washington state. Download the zip file with dataset with requests from https://www.kaggle.com/api/v1/datasets/download/sahirmaharajj/electric-vehicle-population"
    },
    {
        display: "Analyze Vehicle Fatalities",
        prompt: "Visualize which vehicle types are most deadly to pedestrians and cyclists, measuring total fatalities and fatality rate per collision. Use the data from https://raw.githubusercontent.com/mito-ds/mito/refs/heads/dev/jupyterhub/nyc_car_crashes.csv"
    },
    {
        display: "Compare Trade Surpluses",
        prompt: "Graph the countries that have the highest trade surplus with America. Use the data from https://raw.githubusercontent.com/mito-ds/mito/refs/heads/dev/jupyterhub/us_tarrifs.csv"
    }
];

interface ScrollableSuggestionsProps {
    onSelectSuggestion: (prompt: string) => void;
}

const ScrollableSuggestions: React.FC<ScrollableSuggestionsProps> = ({  
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
        const handleScroll = (): void => {
            updateScrollMask(suggestionsContainer);
        };
        
        // Update mask on window resize
        const handleResize = (): void => {
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
    }, [DEFAULT_SUGGESTION_OPTIONS.length]); // Re-apply when options change

    return (
        <div className="chat-suggestions" ref={suggestionsRef}>
            {DEFAULT_SUGGESTION_OPTIONS.map((opt) => (
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