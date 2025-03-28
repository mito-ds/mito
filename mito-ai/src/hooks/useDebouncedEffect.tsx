/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect } from "react";

/* 
    https://stackoverflow.com/questions/54666401/how-to-use-throttle-or-debounce-with-react-hook
*/
export const useDebouncedEffect = (
    effect: () => (void | (() => void)), deps: unknown[], 
    delay: number,
): void => {
    useEffect(() => {
        // Just like useEffect, you can return a result function that runs on
        // cleanup. We just default here to a noop.
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        let cleanup = (): void => {}
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