import { useEffect } from "react";

/* 
    https://stackoverflow.com/questions/54666401/how-to-use-throttle-or-debounce-with-react-hook
*/
export const useDebouncedEffect = (
    effect: () => (void | (() => void)), deps: unknown[], 
    delay: number,
): void => {
    useEffect(() => {
        // Cleanup defaults to a noop, but you can also return a function 
        // from the effect to have it run on cleanup
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        let cleanup = () => {}
        const handler = setTimeout(() => {
            const result = effect()
            if (result instanceof Object) {
                cleanup = result;
            }
        }, delay);

        return () => {
            clearTimeout(handler);
            cleanup();
        };
    }, [...deps || [], delay])
}