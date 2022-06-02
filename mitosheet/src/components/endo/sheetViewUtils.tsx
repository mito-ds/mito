import { isAnyElementWithSelectorEntirelyVisible } from "./domUtils";
import { DEFAULT_HEIGHT } from "./EndoGrid";
import { Dimension, GridState, RendererTranslate, ScrollPosition, SheetView } from "../../types";


/* 
    Calculates the current sheet view based on the widths of the columns, 
    and the scroll location in the sheet.

    The tricky logic here is finding the startingColumnIndex. We do this
    by finding the first column that should be entirely visible, that is
    the first column where the width including this column is greater
    than the amount we have scrolled left in the sheet.

    Then, to find the number of columns displayed, we keep taking columns
    until the total width including this column is greater than the 
    scrollLeft + the width of the sheet.
*/
export const calculateCurrentSheetView = (
    gridState: GridState
): SheetView => {

    // If the sheetIndex does not exist in the widthDataArray, then 
    // just return a default SheetView.
    if (gridState.sheetIndex >= gridState.widthDataArray.length) {
        return {
            startingRowIndex: -1,
            numRowsRendered: 0,
            startingColumnIndex: 0,
            numColumnsRendered: 0
        }
    }

    let foundStart = false;
    let startingColumnIndex = 0;
    let numColumnsRendered = 0;

    for (let i = 0; i < gridState.widthDataArray[gridState.sheetIndex].widthArray.length; i++) {
        const totalWidth = gridState.widthDataArray[gridState.sheetIndex].widthSumArray[i];

        if (!foundStart && totalWidth > gridState.scrollPosition.scrollLeft) {
            startingColumnIndex = i;
            foundStart = true;
        }

        if (foundStart && totalWidth > (gridState.scrollPosition.scrollLeft + gridState.viewport.width)) {
            numColumnsRendered = i - startingColumnIndex + 1;
            break;
        } else if (i === gridState.widthDataArray[gridState.sheetIndex].widthArray.length - 1) {
            // If we reach the end of the columns without running out of space to display them
            // then we should just display all of them 
            numColumnsRendered = i - startingColumnIndex + 1
        }
    }

    return {
        startingRowIndex: Math.max(Math.floor(gridState.scrollPosition.scrollTop / DEFAULT_HEIGHT), 0),
        numRowsRendered: Math.ceil(gridState.viewport.height / DEFAULT_HEIGHT) + 3, // For some reason, we add three. It gets weird with multi-index headers, dk why
        startingColumnIndex: startingColumnIndex,
        numColumnsRendered: numColumnsRendered,
    }
}

/* 
    Calculates how much we should translate rendered data. Fundamentally,
    translate.x should be equal to the number of pixels
    thare are cut off in the startingColumnIndex.

    Consider if startingColumnIndex = 0. Thus, we should just set
    this equal to the scrollLeft. 

    If startingColumnIndex is not 0, then the amount that is cut off is
    the scrollLeft - widthData.widthArray[startingColumnIndex - 1].
    
*/
export const calculateTranslate = (gridState: GridState): RendererTranslate => {
    const currentSheetView = calculateCurrentSheetView(gridState);

    return {
        x: gridState.scrollPosition.scrollLeft - (currentSheetView.startingColumnIndex === 0 ? 0 : gridState.widthDataArray[gridState.sheetIndex].widthSumArray[currentSheetView.startingColumnIndex - 1]),
        y: gridState.scrollPosition.scrollTop % (DEFAULT_HEIGHT),
    }
}

export const calculateNewScrollPosition = (
    e: React.UIEvent<HTMLDivElement, UIEvent>,
    totalSize: Dimension,
    viewport: Dimension,
    scrollAndRenderedContainerDiv: HTMLDivElement | null
): ScrollPosition | undefined => {
    
    // Maximum amount you can scroll in any direction
    const maxScrollLeft = totalSize.width - viewport.width;
    const maxScrollTop = totalSize.height - viewport.height;
    
    // And it might not even be possible to scroll at all
    const noScrollLeft = totalSize.width < (scrollAndRenderedContainerDiv?.clientWidth || 0);
    const noScrollDown = totalSize.height < (scrollAndRenderedContainerDiv?.clientHeight || 0);

    const target = e.target as HTMLDivElement | null;
    if (target === null) {
        return undefined;
    }
    // Get the new amount scrolled
    const { scrollLeft, scrollTop } = target;

    let newScrollLeft = scrollLeft;
    let newScrollTop = scrollTop;

    // Don't let the user scroll beyond the bounds in either direction
    if (scrollLeft >= maxScrollLeft && !noScrollLeft) {
        // Bump it back by one pixel, just so we don't scroll out of bounds 
        // and get an empty white screen for some reason...
        newScrollLeft = maxScrollLeft - 1;
    } else if (noScrollLeft) {
        newScrollLeft = 0;
    }
    if (scrollTop >= maxScrollTop && !noScrollDown) {
        newScrollTop = maxScrollTop;
    } else if (noScrollDown) {
        newScrollTop = 0;
    }

    return {
        scrollLeft: newScrollLeft || 0,
        scrollTop: newScrollTop || 0
    };
}


export const rowIsVisible = (containerRef: HTMLDivElement | null, rowIndex: number): boolean => {
    if (containerRef === null) {
        return false;
    }
    return isAnyElementWithSelectorEntirelyVisible(containerRef, `[mito-row-index="${rowIndex}"]`);
}

export const columnIsVisible = (containerRef: HTMLDivElement | null, columnIndex: number): boolean => {
    if (containerRef === null) {
        return false;
    }

    // We search for the the column index, but also something with the row index to make sure we
    // are detecting only full cells, as some items in the column header have the mito-col-index
    // set as well
    return isAnyElementWithSelectorEntirelyVisible(containerRef, `[mito-col-index="${columnIndex}"][mito-row-index]`);
}


export const getCellInRow = (containerRef: HTMLDivElement | null, rowIndex: number, ): HTMLDivElement | undefined => {
    if (containerRef === null) {
        return undefined;
    }

    const nodeList = containerRef.querySelectorAll(`[mito-row-index="${rowIndex}"]`);
    if (nodeList === undefined || nodeList.length === 0) {
        return undefined;
    }

    return nodeList[0] as HTMLDivElement;
}

export const getCellInColumn = (containerRef: HTMLDivElement | null, columnIndex: number, ): HTMLDivElement | undefined => {
    if (containerRef === null) {
        return undefined;
    }

    const nodeList = containerRef.querySelectorAll(`[mito-col-index="${columnIndex}"]`);
    if (nodeList === undefined || nodeList.length === 0) {
        return undefined;
    }

    return nodeList[0] as HTMLDivElement;
}

export const getCellDiv = (containerRef: HTMLDivElement | null, rowIndex: number, columnIndex: number): HTMLDivElement | undefined => {
    if (containerRef === null) {
        return undefined;
    }

    const nodeList = containerRef.querySelectorAll(`[mito-row-index="${rowIndex}"][mito-col-index="${columnIndex}"]`);
    if (nodeList === undefined || nodeList.length === 0) {
        return undefined;
    }

    return nodeList[0] as HTMLDivElement;
}