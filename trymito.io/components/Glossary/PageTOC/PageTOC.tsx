import React, { useEffect, useState } from 'react';
import { classNames } from '../../../utils/classNames';
import pageTOCStyles from './PageTOC.module.css';

type Heading = {
    // We use the ID of the element as both the title we display in the TOC
    // and how we find the element on the page to scroll to when the user clicks on the TOC item
    id: string; 

    // The level of the heading (e.g., "h2", "h3") is used to determine the indentation of the TOC item
    level: string;
}

const PageTOC = () => {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeHeading, setActiveHeading] = useState<Heading | undefined>(undefined);

    useEffect(() => {
        // Query all heading elements (h2, h3) in the content
        const headingElements = document.querySelectorAll('h2, h3');
    
        // Extract text and level (e.g., "h1", "h2") from heading elements
        const headingsArray: Heading[] = Array.from(headingElements).map((heading) => ({
            level: heading.tagName.toLowerCase(),
            id: heading.id,
        })).filter((heading) => heading.id !== "");
    
        setHeadings(headingsArray);
    }, []); // This useEffect only runs once on component mount
    

    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout | null = null;
    
        const handleScroll = () => {
            // Check if the headings array is empty
            if (headings.length === 0) {
                return;
            }
        
            // Clear any existing timeout
            if (scrollTimeout !== null) {
                clearTimeout(scrollTimeout);
            }
        
            // Set a new timeout to debounce the scroll event
            // so that we don't fire this event listener for every pixel scrolled
            scrollTimeout = setTimeout(() => {
                // Find the heading that is currently in view
                for (let i = 0; i < headings.length; i++) {
                    const heading = headings[i];
                    const headingElement = document.getElementById(heading.id);
            
                    if (headingElement === null) {
                        return;
                    }
                    const rect = headingElement.getBoundingClientRect();
            
                    if (rect.top > 50) {
                        setActiveHeading(heading);
                        return;
                    }
                }
        
                // If no heading is in view, clear the active heading
                setActiveHeading(undefined);
            }, 10);
        };
    
        // Attach the scroll event listener when headingsArray is populated
        if (headings.length > 0) {
            window.addEventListener('scroll', handleScroll);
        }
    
        // Cleanup: Remove event listener on component unmount
        return () => {
            if (scrollTimeout !== null) {
                clearTimeout(scrollTimeout);
            }
            window.removeEventListener('scroll', handleScroll);
        };
      }, [headings]);
        

    const handleItemClick = (headingId: string) => {
        const targetElement = document.getElementById(headingId);

        if (targetElement) {
            // Calculate the target position with a 200px offset from the top so it doesn't get blocked by the header
            const offset = 200;
            const targetPosition = targetElement.getBoundingClientRect().bottom + window.scrollY - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth', 
            });
        }
    };

    return (
        <aside className={pageTOCStyles.container}>
            <p>On this Page</p>
            {headings.map((heading) => (
                <p
                    key={heading.id}
                    onClick={(e) => handleItemClick(heading.id)}
                    className={classNames(
                        pageTOCStyles.item, 
                        {[pageTOCStyles.indent]: heading.level === 'h3'},
                        {'text-secondary': activeHeading?.id !== heading.id},
                        {'text-highlight': activeHeading?.id === heading.id}
                    )}
                >
                    {heading.id}
                </p>
            ))}
        </aside>
    );
};

export default PageTOC;
