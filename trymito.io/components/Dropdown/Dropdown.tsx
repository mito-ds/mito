/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import fscreen from 'fscreen';

import dropdownStyles from './Dropdown.module.css'
import { useCallOnAnyClick } from '../../utils/useCallOnAnyClick';

// NOTE: these must match their definitions in the Dropdown.css
const MAX_HEIGHT = 250;


/* 
    If the dropdown is open, then this class name can be used to label
    any element that you do not want to cause a close of the dropdown
    if it is clicked on.
    If an element (or it's descendants) with this class are clicked on
    when a dropdown is open, the dropdown will remain open.
*/
export const DROPDOWN_IGNORE_CLICK_CLASS = 'dropdown-ignore-click';

interface DropdownProps {
    /** 
        * @param children - The DropdownItem(s) that are going to be inside the dropdown 
    */
    children: JSX.Element | JSX.Element[];
    /** 
        * @param closeDropdown - The function to used to close the dropdown when the user clicks
    */
    closeDropdown: () => void;
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
    The topAdjustment is the amount of space you can leave at the top of 
    the container, in case there is something (like a search) fixed up there.
*/
export const ensureInView = (container: HTMLDivElement, element: HTMLDivElement, topAdjustment: number): void => {

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
    onEscape: () => void,
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
            const dropdownDiv = document.getElementById('dropdown') as HTMLDivElement | null;
            const selectedItemDiv = document.querySelector('.dropdown-item-selected') as HTMLDivElement | null;
            if (dropdownDiv !== null && selectedItemDiv !== null) {
                ensureInView(dropdownDiv, selectedItemDiv, 50);
            }
        })

    } else if (enterDown) {
        // If the user presses enter, then we click on the element, after a slight delay so that 
        // this keyDown Enter event doesn't trigger the onSubmit event of any form that is opened.
        setTimeout(() => {
            const selectedItemDiv = document.querySelector('.dropdown-item-selected') as HTMLDivElement | null;
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

    /* Close the dropdown anytime anyone clicks anywhere unless they click on */
    useCallOnAnyClick(props.closeDropdown)

    const [boundingRect, setBoundingRect] = useState<BoundingRect>({
        top: undefined,
        bottom: undefined,
        right: undefined,
        left: undefined
    })
    

    // The div that contains the actual dropdown, and is added to the highest
    // level of the html, so the dropdown's z-index can be above everything else
    const dropdownContainerElement = useRef(document.createElement("div"));
    // We store if this select was created when the element was in fullscreen or
    // not, which is helpful for cleaning up the select
    const [isNotFullscreen] = useState(fscreen.fullscreenElement === undefined || fscreen.fullscreenElement === null);
    // If we are in fullscreen, we need the closest mito container, and so
    // we store it in this case so we have access to it
    const mitoContainerRef = useRef<Element | null>(null);

    const widthPixels = 100;

    return (
        <div
            className={dropdownStyles.dropdown} 
            id='dropdown'
            style={{
                position: 'absolute',
                top: boundingRect.top, 
                bottom: boundingRect.bottom, 
                right: boundingRect.right, 
                left: boundingRect.left, 
            }}>
            <div className='dropdown-items-container'>
                {props.children}
            </div>
        </div>
    );
} 

export default Dropdown;