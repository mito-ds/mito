// Copyright (c) Mito
import fscreen from 'fscreen';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import '../../../../css/elements/Dropdown.css';
import { clickedOnClass, useCallOnAnyClick } from '../../hooks/useCallOnAnyClick';
import { MitoTheme } from '../../types';
import { classNames } from '../../utils/classNames';
import { isInStreamlit } from '../../utils/location';
import { fuzzyMatch } from '../../utils/strings';
import Row from '../layout/Row';
import Input from './Input';
import { WIDTH_MAPPING } from './sizes.d';

// NOTE: these must match their definitions in the Dropdown.css
const MAX_HEIGHT = 250;

/* 
    Helper functions for figuring out where to place the dropdown
    so that it is not out of bounds of the screen.

    To do so, each function uses the MAX_HEIGHT and passed widthPixels
    variables and checks that in the worst case, the entire dropdown will 
    still be on screen given a certain bounding rect setting!
*/
const topInBounds = (top: number): boolean => {
    const windowHeight = window.innerHeight;
    return top + MAX_HEIGHT < windowHeight;
}
const leftInBounds = (left: number, widthPixels: number): boolean => {
    const widthWidth = window.innerWidth;
    return left + widthPixels < widthWidth;
}
const bottomInBounds = (bottom: number): boolean => {
    return bottom - MAX_HEIGHT > 0;
}
const rightInBounds = (right: number, widthPixels: number): boolean => {
    return right - widthPixels > 0;
}

/* 
    If the dropdown is open, then this class name can be used to label
    any element that you do not want to cause a close of the dropdown
    if it is clicked on.

    If an element (or it's descendants) with this class are clicked on
    when a dropdown is open, the dropdown will remain open.
*/
export const DROPDOWN_IGNORE_CLICK_CLASS = 'mito-dropdown-ignore-click';
export const DROPDOWN_SUPRESS_FOCUS_ON_CLOSE = 'mito-dropdown-suppress-focus-on-close';

interface DropdownProps {
    /** 
        * @param children - The DropdownItem(s) that are going to be inside the dropdown 
    */
    children: JSX.Element | JSX.Element[];
    /** 
        * @param display - if the dropdown should be displayed. We always render the container
        * node from the dropdown, so that we can handle focus properly in more cases. This 
        * requires doing the casing on displaying the dropdown within this file
    */
    display: boolean;
    /** 
        * @param closeDropdown - The function to used to close the dropdown when the user clicks.
    */
    closeDropdown: () => void;
    /**
        * @param [searchable] - When True, a search input field is displayed. Defaults to False
     */
    searchable?: boolean;
    /**
        * @param [width] - The width of the dropdown that gets created
     */
    width?: 'small' | 'medium' | 'large';

    theme?: MitoTheme
}

// Where to place the dropdown
type BoundingRect = {
    top: number | undefined;
    bottom: number | undefined;
    right: number | undefined;
    left: number | undefined;
};

/* 
    Helper function ensures that an item is visible inside a container, 
    and scrolls the minimal amount to make sure that it is visible.

    NOTE: container must have some non-default positioning on it for 
    this function to work properly, otherwise scrolling will look all
    screwed up and you'll be confused for a while.

    NOTE: Seriously. Before trying to debug this function, go set relative
    positioning on the container element. You'll save yourself a lot of
    debugging time. Lol...

    The topAdjustment is the amount of space you can leave at the top of 
    the container, in case there is something (like a search) fixed up there.
*/
export const ensureInView = (container: HTMLDivElement, element: HTMLDivElement, topAdjustment: number): void => {
    // NOTE: if you're trying to use this function, check the
    // comment above to make sure you've set relative positioning on the container

    // Determine container top and bottom
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    // Determine element top and bottom
    const elementTop = element.offsetTop;
    const elementBottom = elementTop + element.clientHeight;

    // Check if out of view, and adjust if so
    if (elementTop < (containerTop + topAdjustment)) {
        container.scrollTop -= (containerTop - elementTop + topAdjustment);
    }
    else if (elementBottom > containerBottom) {
        container.scrollTop += (elementBottom - containerBottom);
    }
}

/*
    Handles keyboard events when using the dropdown. 
*/
export const handleKeyboardInDropdown = (
    e: React.KeyboardEvent<HTMLInputElement>, 
    numDropdownItems: number, 
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>,
    onEscape: () => void
): void => {

    const keyUp = e.key === 'Up' || e.key === 'ArrowUp';
    const keyDown = e.key === 'Down' || e.key === 'ArrowDown';
    const enterDown = e.key === 'Enter';
    const escapeDown = e.key === 'Escape';
    const metaKey = e.metaKey;

    if (keyUp || keyDown) {
        // If up or down is pressed, scroll within the 
        // dropdown suggestions, so prevent default
        e.preventDefault();

        if (keyUp) {
            setSelectedIndex(selectedIndex => {
                if (metaKey) {
                    // If we're selecting something, we just jump to the first dropdown item
                    // but if we're already on the first dropdown item, then we stop selecting anything
                    if (selectedIndex > 0) {
                        return 0
                    }
                    return -1;
                } else {
                    return Math.max(-1, selectedIndex - 1)
                }
            });
        } else {
            setSelectedIndex(selectedIndex => {
                if (metaKey) {
                    return numDropdownItems - 1;
                } else {
                    return Math.min(selectedIndex + 1, numDropdownItems - 1)
                }
            });
        }

        // After a little timeout (e.g. the above executes), we scroll
        // to make sure that this newly selected element is visible
        setTimeout(() => {
            const dropdownDiv = document.querySelector('.mito-dropdown-items-container') as HTMLDivElement | null;
            const selectedItemDiv = document.querySelector('.mito-dropdown-item-selected') as HTMLDivElement | null;
            if (dropdownDiv !== null && selectedItemDiv !== null) {
                ensureInView(dropdownDiv, selectedItemDiv, 50);
            }
        })

    } else if (enterDown) {
        // If the user presses enter, then we click on the element, after a slight delay so that 
        // this keyDown Enter event doesn't trigger the onSubmit event of any form that is opened.
        setTimeout(() => {
            const selectedItemDiv = document.querySelector('.mito-dropdown-item-selected') as HTMLDivElement | null;
            if (selectedItemDiv) {
                selectedItemDiv.click()
            }
        }, 200)
    } else if (escapeDown) {
        // If the user presses escape on the input, then close the 
        // whole dropdown
        onEscape();
    }
}


/**
 * The Dropdown component is used to display dropdown menus. It closes
 * automatically when the user clicks anywhere, including on the items
 * in the dropdown itself.
 * 
 * The dropdown component places itself on top of everything else on screen,
 * and will place itself near its parent component. It will make sure that all 
 * the DropdownItems it is displaying are on screen.
 */ 
const Dropdown = (props: DropdownProps): JSX.Element => {
    
    const [searchString, setSearchString] = useState('');
    // If the selected index is -1, then nothing is selected
    const [selectedIndex, setSelectedIndex] = useState(-1);
    
    /* Close the dropdown anytime anyone clicks anywhere unless they click on:
        1. the dropdown's search field
        2. a disabled dropdown item
    */
    useCallOnAnyClick((eventTarget: EventTarget | null | undefined) => {
        if (!props.display) {
            return;
        }

        // Close the dropdown
        props.closeDropdown();

        if (!clickedOnClass(eventTarget, DROPDOWN_SUPRESS_FOCUS_ON_CLOSE)) {
            // Refocus on the div that is the parent of the dropdown
            // so that users are focused where they expect
            dropdownAnchor.current?.focus();
        }

    }, DROPDOWN_IGNORE_CLICK_CLASS)

    const [boundingRect, setBoundingRect] = useState<BoundingRect>({
        top: undefined,
        bottom: undefined,
        right: undefined,
        left: undefined
    })
    
    // The anchor for the dropdown, that is placed as a child the parent
    // and is how we figure out who the parent of the dropdown is
    const dropdownAnchor = useRef<HTMLDivElement | null>(null);

    // The div that contains the actual dropdown, and is added to the highest
    // level of the html, so the dropdown's z-index can be above everything else.
    // We onlt need one of these 
    const [dropdownContainerElement] = useState(() => {
        return document.createElement("div")
    })
    // We store if this select was created when the element was in fullscreen or
    // not, which is helpful for cleaning up the select
    const [isNotFullscreen, setIsNotFullscreen] = useState(fscreen.fullscreenElement === undefined || fscreen.fullscreenElement === null);
    // If we are in fullscreen, we need the closest mito container, and so
    // we store it in this case so we have access to it
    const mitoContainerRef = useRef<Element | null>(null);

    const width = props.width || 'large';
    const widthPixels = WIDTH_MAPPING[width];

    // This just cleans up the dropdown container, when the component unrenders
    // So that we don't leave a bunch of divs lying around
    useEffect(() => {
        return () => {
            try {
                if (isNotFullscreen) {
                    document.body.removeChild(dropdownContainerElement)
                } else {
                    if (mitoContainerRef.current) {
                        mitoContainerRef.current.removeChild(dropdownContainerElement)
                    }
                }
            } catch {
                // If we fail cleaning up a dropdown, we don't want to crash the sheet
            }
        }
    }, [])

    // When we first render the dropdownAnchor, make sure to save it 
    // and to update the position of the dropdown
    const setRef = useCallback((unsavedDropdownAnchor: HTMLDivElement) => {
        if (unsavedDropdownAnchor !== null) {
            // Save this node, so that we can update 
            dropdownAnchor.current = unsavedDropdownAnchor;
            
            if (isNotFullscreen) {
                // Add element to the document, if we're not in 
                // fullscreen mode
                document.body.append(dropdownContainerElement);
            } else {
                // If we are in fullscreen mode, then place the dropdownContainerElement in the
                // mitoContainer so that it is visible in fullscreen mode
                const mitoContainer = unsavedDropdownAnchor.closest('.mito-container');
                if (mitoContainer) {
                    mitoContainer.appendChild(dropdownContainerElement)
                    mitoContainerRef.current = mitoContainer;
                }
            }

            updateDropdownPosition(unsavedDropdownAnchor);
        }
    },[]);


    // Refresh the location of the dropdown for as long as it's open
    // NOTE: we could use an onscroll listener, but in practice it's 
    // wayyyy too laggy. So no thanks.
    useEffect(() => {
        if (dropdownAnchor.current !== null) {
            updateDropdownPosition(dropdownAnchor.current);
        } 
        const interval = setInterval(() => {
            if (dropdownAnchor.current !== null) {
                updateDropdownPosition(dropdownAnchor.current);
            }
        }, 25)
        return () => clearInterval(interval);
    }, [props.display])

    // This effect watches for full screen changes, and moves the dropdown container
    // in the case that we enter or exit fullscreen. This is now necessary because we 
    // always have the same dropdown anchor, whereas before it was redefined when the 
    // dropdown was opened. We need to keep the dropdown anchor always defined so we 
    // can find the parent element of it, and so focus on it's parent
    useEffect(() => {
        const handleChange = () => {
            setIsNotFullscreen(!fscreen.fullscreenElement);

            if (!fscreen.fullscreenElement) {
                // Add element to the document, if we're not in 
                // fullscreen mode
                document.body.append(dropdownContainerElement);
            } else {
                // If we are in fullscreen mode, then place the dropdownContainerElement in the
                // mitoContainer so that it is visible in fullscreen mode
                const mitoContainer = dropdownAnchor.current?.closest('.mito-container');
                if (mitoContainer) {
                    mitoContainer.appendChild(dropdownContainerElement)
                    mitoContainerRef.current = mitoContainer;
                }
            }

            if (dropdownAnchor.current) {
                updateDropdownPosition(dropdownAnchor.current);
            }
        };
        fscreen.addEventListener('fullscreenchange', handleChange);
        return () =>
            fscreen.removeEventListener('fullscreenchange', handleChange);
    }, []);

    /* 
        This function actually does the work of figuring out where the 
        dropdown should be placed. To do so, it takes the dropdownContainer
        and finds it's parent, which is effectively the parent of the dropdown.

        Then, it figures out where it can place the dropdown in a way that doesn't
        go offscreen and can actually be seen by the user. It tries the following
        arrangements:

        1. Check if (bottom, left) of the parent can be the (top, left) of the dropdown.
        2. Check if (bottom, right) of the parent can be the (top, right) of the dropdown.
        3. Check if (top, left) of the parent can be the (bottom, left) of the dropdown.
        4. If none of the above work, set (top, right) to the (bottom, right) of the dropdown.            
    */
    const updateDropdownPosition = (dropdownContainer: HTMLDivElement) => {
        
        const parentElement = dropdownContainer.parentElement || dropdownContainer;
        const parentBoundingClientRect = parentElement.getBoundingClientRect();
        const parentTop = parentBoundingClientRect.top;
        const parentBottom = parentBoundingClientRect.bottom ;
        const parentLeft = parentBoundingClientRect.left;
        const parentRight = parentBoundingClientRect.right;
        
        let newBoundingRect: BoundingRect = {
            top: undefined,
            bottom: undefined,
            right: undefined,
            left: undefined 
        };
        if (topInBounds(parentBottom) && leftInBounds(parentLeft, widthPixels)) {
            newBoundingRect = {
                top: parentBottom,
                bottom: undefined,
                right: undefined,
                left: parentLeft
            }
        } else if (topInBounds(parentBottom) && rightInBounds(parentRight, widthPixels)) {
            newBoundingRect = {
                top: parentBottom,
                bottom: undefined,
                right: window.innerWidth - parentRight,
                left:  undefined
            }
        } else if (bottomInBounds(parentTop) && leftInBounds(parentLeft, widthPixels)) {
            newBoundingRect = {
                top: undefined,
                bottom: window.innerHeight - parentTop,
                right: undefined,
                left: parentLeft
            }
        } else {
            newBoundingRect = {
                top: undefined,
                bottom: window.innerHeight - parentTop,
                right: window.innerWidth - parentRight,
                left:  undefined
            }
        }

        // Change the bounding rect (and trigger a rerender) if there is actually something
        // to rerender. We want to avoid rerendering if we don't need to
        setBoundingRect((oldBoundingRect) => {
            if (newBoundingRect.top !== oldBoundingRect.top || newBoundingRect.left !== oldBoundingRect.left || newBoundingRect.bottom !== oldBoundingRect.bottom || newBoundingRect.right !== oldBoundingRect.right) {
                return newBoundingRect;
            }
            return oldBoundingRect;
        })
    }

    // If there are more than 4 elements in the dropdown, compress it so that the user
    // can see more of it. If it's a search, mark it as such
    const dropdownClassNames = classNames('mito-dropdown', `element-width-${width}`,{
        'mito-dropdown-compressed': React.Children.count(props.children) > 4,
        'mito-dropdown-search': props.searchable === true,
        'mito-dropdown-streamlit': isInStreamlit()
    })

    
    let found = 0; // keep track of how many matching items we found to the search
    const childrenToDisplay = React.Children.map(props.children, (child) => {
        // First, we check to see if this is a seperator, and include it in
        // the final children without counting it if so
        // TODO:
        // 1. a separator should never be the first element in the dropdown
        // 2. a separtor should never be the last element in the dropdown
        // 3. there should never be consecutive separators
        if (child.props.isDropdownSectionSeperator) {
            return child;
        }

        const title: string | undefined = child.props.title;
        const inSearch = title !== undefined && fuzzyMatch(title, searchString.toLowerCase()) > .8;

        if (inSearch) {
            // If the element is selected, then add the selected class to it
            const selected = found === selectedIndex;  
            const finalChild = React.cloneElement(child, {
                className: classNames(child.props.className, {
                    'mito-dropdown-item-selected': selected
                })
            })
            found += 1;
            return finalChild;            
        } else {
            // Dont' display if it's not in search
            return null;
        }
    });

    const scrollRef = useRef<NodeJS.Timer | null>(null);
    const dropdownItemContainerRef = useRef<HTMLDivElement | null>(null);
    const [showScrollUp, setShowScrollUp] = useState(false);
    const [showScrollDown, setShowScrollDown] = useState(childrenToDisplay.length > 6);

    const updateScrollPosition = () => {
        const scrollHeight = dropdownItemContainerRef.current?.scrollHeight ?? 0;
        const scrollTop = dropdownItemContainerRef.current?.scrollTop ?? 0;
        const clientHeight = dropdownItemContainerRef.current?.clientHeight ?? 0;
        
        if (dropdownItemContainerRef.current?.scrollTop === 0) {
            setShowScrollUp(false);
        } else if (scrollHeight <= scrollTop + clientHeight) {
            setShowScrollDown(false);
        } else {
            setShowScrollDown(true);
            setShowScrollUp(true);
        }
    }
    
    return (
        <div ref={setRef} tabIndex={0}>
            {/* 
                To see more about ReactDOM.createPortal, read the documentation here:
                https://reactjs.org/docs/portals.html

                TLDR: they allow us to escape the z-index stack that we're currently in,
                and place the dropdown on top of everything!
            */}
            {props.display && ReactDOM.createPortal(
                <div 
                    className={dropdownClassNames} 
                    style={{
                        position: 'fixed',
                        top: boundingRect.top, 
                        bottom: boundingRect.bottom, 
                        right: boundingRect.right, 
                        left: boundingRect.left, 
                    }}>
                    {props.searchable && 
                        <div className={classNames('mito-dropdown-search-input', DROPDOWN_IGNORE_CLICK_CLASS)}>
                            <Input 
                                value={searchString}
                                placeholder='Search'
                                onKeyDown={(e) => {
                                    // NOTE: we need to stop prop because in notebooks, this will go up to the 
                                    // code cell, and start editing it (e.g. turning it to markdown). That is 
                                    // obviously bad
                                    e.stopPropagation();

                                    handleKeyboardInDropdown(e, found, setSelectedIndex, props.closeDropdown);

                                }}
                                onChange={e => {
                                    setSelectedIndex(-1);
                                    setSearchString(e.target.value)
                                }}
                                autoFocus={true}
                            />
                        </div>
                    }
                    <div
                        style={{ display: showScrollUp ? 'flex' : 'none', justifyContent: 'center'}}
                        onMouseEnter={() => {
                            // Scroll down when the mouse enters this div
                            scrollRef.current = setInterval(() => {
                                dropdownItemContainerRef.current?.scrollBy(0, -2)
                                updateScrollPosition();
                            })
                        }}
                        onMouseLeave={() => {
                            // Stop scrolling when the mouse leaves this div
                            if (scrollRef.current) {
                                clearInterval(scrollRef.current);
                            }
                        }}
                    >
                        ⌃
                    </div>
                    {childrenToDisplay.length > 0 && 
                        <div ref={dropdownItemContainerRef} className='mito-dropdown-items-container'>
                            {childrenToDisplay}
                        </div>
                    }
                    {found === 0 && 
                        <Row justify='center' style={{paddingTop: '50px'}}>
                            <p className='text-body-2'>
                                No options to display 
                            </p>
                        </Row>}
                    
                    <div
                        style={{ display: showScrollDown ? 'flex' : 'none', justifyContent: 'center'}}
                        onMouseEnter={() => {
                            // Scroll down when the mouse enters this div
                            scrollRef.current = setInterval(() => {
                                dropdownItemContainerRef.current?.scrollBy(0, 2)
                                updateScrollPosition();
                            })
                        }}
                        onMouseLeave={() => {
                            // Stop scrolling when the mouse leaves this div
                            if (scrollRef.current) {
                                clearInterval(scrollRef.current);
                            }
                        }}
                    >
                        ⌄
                    </div>
                </div>,
                dropdownContainerElement
            )}
        </div>
    );
} 

export default Dropdown;