/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


// Helper function to scroll to div
export const scrollToDiv = (div: React.RefObject<HTMLDivElement>): void => {
    setTimeout(() => {
        const divContainer = div.current;
        if (divContainer) {
            divContainer.scrollTo({
                top: divContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, 100);
};