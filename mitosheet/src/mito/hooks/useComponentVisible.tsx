/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useRef } from "react";

/*
    This hook is used to detect when the user clicks outside of a specific component. When the user
    does, it calls the passed function. 

    This is used to close the dropdown when the user clicks outside of it. 

    Adapted from https://stackoverflow.com/questions/54560790/detect-click-outside-react-component-using-hooks
*/
export function useComponentVisible(onExternalClick: () => void): {ref: React.MutableRefObject<HTMLDivElement | null>} {
    const ref = useRef<null | HTMLDivElement>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClickOutside = (event: any) => {
        // We check if the current click is outside the element, and call close if so
        if (ref.current && !ref.current.contains(event.target)) {
            /* 
                We delay actually closing by 100 seconds, just in case the user has clicked
                outside the dropdown, but on the button that closes the dropdown itself. This 
                makes sure that we don't close and then immediately reopen the component.

                It is an ugly hack, but it appears to work for now!
            */
            setTimeout(() => {
                onExternalClick();
            }, 100)
            
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    });

    return { ref };
}