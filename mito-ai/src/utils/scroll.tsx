
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