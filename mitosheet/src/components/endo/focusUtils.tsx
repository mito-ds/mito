/* 
    To catch events like an "onKeyUp" in the grid, we need a child element
    of the grid (or the grid itself) to be the active element on the page. 

    Our strategy is to have two elements that can accept focus. The first
    element is cell editor (which is an input, duh). The second is the main
    grid container itself.

    The other option is focusing on the cells as we select them, but this
    as the distinct disadvantage of being annoying / hard to manage as we
    delete, edit, and move around in cells. 

    Thus, we simply need to make sure that when the grid is being interacted
    with, the grid is focused on!
*/


export const focusGrid = (containerDiv: HTMLDivElement | null | undefined): void => {
    if (containerDiv) {
        containerDiv.focus()
    }
} 