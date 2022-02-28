/*
    From: https://stackoverflow.com/a/61842546/14993381

    This function lets you pass a callback to a useState so that 
    the callback function is ensured to use the most updated state. 

    This behaves similarly to passing a callback to this.setState in class components.

*/

import { useCallback, useEffect, useRef, useState } from "react";
import { GraphParams } from "../types";

export function useStateCallback(initialState: () => GraphParams): [GraphParams, (state: GraphParams, cb: any) => void] {
    const [state, setState] = useState(initialState);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cbRef = useRef<any>(null); // init mutable ref container for callbacks
  
    const setStateCallback = useCallback((state: GraphParams, cb) => {
        cbRef.current = cb; // store current, passed callback in ref
        setState(state);
    }, []); // keep object reference stable, exactly like `useState`
  
    useEffect(() => {
        // cb.current is `null` on initial render, 
        // so we only invoke callback on state *updates*
        if (cbRef.current) {
            console.log('state: ', state)
            cbRef.current(state);
            cbRef.current = null; // reset callback after execution
        }
    }, [state]);
  
    return [state, setStateCallback];
}