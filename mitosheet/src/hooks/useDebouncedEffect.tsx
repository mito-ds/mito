import { useEffect } from "react";

/* 
    https://stackoverflow.com/questions/54666401/how-to-use-throttle-or-debounce-with-react-hook
*/
export const useDebouncedEffect = (effect: () => void, deps: unknown[], delay: number): void => {
    useEffect(() => {
        const handler = setTimeout(() => effect(), delay);

        return () => clearTimeout(handler);
    }, [...deps || [], delay])
}