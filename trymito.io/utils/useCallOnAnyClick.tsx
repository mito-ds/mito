/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import { useEffect } from "react";

// This hook detects when the user makes any click, and then calls the passed function.
export function useCallOnAnyClick(onClick: () => void): void {

    const handleClick = (event: MouseEvent) => { 
        /* 
            We delay actually calling of the function by 100 miliseconds, just in case the user's click is 
            actually on the dropdown open/close button. This makes sure that we don't close and then 
            immediately reopen the component.
            It is an ugly hack, but it appears to work for now!
        */
        setTimeout(() => {
            onClick();
        }, 100)
    };

    useEffect(() => {
        document.addEventListener('click', handleClick, true);
        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    });
}