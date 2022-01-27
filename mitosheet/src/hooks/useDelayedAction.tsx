import { useState } from 'react';

/* 
    NOTE: THIS IS DEPRECATED. USE THE useDebouncedEffect TO ACCOMPLISH WHAT
    YOU WANT TO DO WITH THIS HOOK!

    A hook that allows you to make a certain action occur a certain amount 
    of time, while allowing you to change it if it has not occured yet - which
    in turn sets the delay back to 0.

    Useful for actions like filtering, where we don't want to send filter
    events to quickly - as they cause the backend to do more work than we
    need it to.

    NOTE: THIS IS DEPRECATED. USE THE useDebouncedEffect TO ACCOMPLISH WHAT
    YOU WANT TO DO WITH THIS HOOK!
*/
function useDelayedAction(delay: number): [(newAction: () => void) => void] {
    const [storedTimeout, setStoredTimeout] = useState<NodeJS.Timeout | undefined>(undefined)

    const changePendingAction = (newAction: () => void) => {
        if (storedTimeout !== undefined) {
            global.clearTimeout(storedTimeout);
        }
        const newTimeout = global.setTimeout(newAction, delay);
        setStoredTimeout(newTimeout);
    }

    return [changePendingAction];
}

export default useDelayedAction;