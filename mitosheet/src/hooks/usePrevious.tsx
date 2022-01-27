import { useEffect, useRef } from "react";

/* 
    From: https://stackoverflow.com/questions/53446020/how-to-compare-oldvalues-and-newvalues-on-react-hooks-useeffect

    This function allows you to store the previous value of
    a prop in a functional component, which is useful when
    watching for certain types of changes.

    For example, the pivot modal watches the last step index,
    and if it decreases, then there must have been an undo, in
    which case the pivot modal needs to refresh it's params.
*/
export default function usePrevious<Type>(value: Type): Type | undefined {
    const ref = useRef<Type>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}