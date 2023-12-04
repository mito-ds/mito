import { GridState, SheetView, UIState } from "../../types";
import { DEFAULT_HEIGHT } from "./EndoGrid";
import { columnIsVisible, rowIsVisible } from "./sheetViewUtils";
import { isNumberInRangeInclusive } from "./utils";


// A helper to scroll a given row into view
const scrollRowIntoView = (containerDiv: HTMLDivElement | null, scrollAndRenderedContainerDiv: HTMLDivElement | null, currentSheetView: SheetView, rowIndex: number) => {

    // The column headers are always visible, so we don't have to do anything
    if (rowIndex === -1) {
        return;
    }

    if (scrollAndRenderedContainerDiv === null) return;
    let scrollTop = scrollAndRenderedContainerDiv.scrollTop;

    const rowVisible = rowIsVisible(containerDiv, rowIndex);
    if (!rowVisible) {
        const newCellIsAbove = rowIndex <= currentSheetView.startingRowIndex;
        if (newCellIsAbove) {
            scrollTop = (rowIndex) * DEFAULT_HEIGHT;
        } else {
            scrollTop = (rowIndex + 1) * DEFAULT_HEIGHT - (scrollAndRenderedContainerDiv.clientHeight);
        }
    }

    scrollAndRenderedContainerDiv.scrollTop = scrollTop;

}

// A helper to scroll a column into view
export const scrollColumnIntoView = (containerDiv: HTMLDivElement | null, scrollAndRenderedContainerDiv: HTMLDivElement | null, currentSheetView: SheetView, gridState: GridState, columnIndex: number) => {

    // The index headers are always visible, so we don't have to do anything
    if (columnIndex === -1) {
        return;
    }

    if (scrollAndRenderedContainerDiv === null) return;
    let scrollLeft = scrollAndRenderedContainerDiv.scrollLeft;

    const columnVisible = columnIsVisible(containerDiv, columnIndex);
    if (!columnVisible) {
        const newCellIsLeft = columnIndex <= currentSheetView.startingColumnIndex;
        if (newCellIsLeft) {
            scrollLeft = gridState.widthDataArray[gridState.sheetIndex]?.widthSumArray[columnIndex - 1] || 0;
        } else {
            // Put it at the start, move it to the end, then move it back one
            scrollLeft = gridState.widthDataArray[gridState.sheetIndex]?.widthSumArray[columnIndex] - (scrollAndRenderedContainerDiv.clientWidth) || 0;
        }
    }

    scrollAndRenderedContainerDiv.scrollLeft = scrollLeft;
}


/* 
    Makes sure the given rowIndex and columnIndex are visible, by scrolling
    the screen the minimal amount to make them visible
*/
export const ensureCellVisible = (containerDiv: HTMLDivElement | null, scrollAndRenderedContainerDiv: HTMLDivElement | null, currentSheetView: SheetView, gridState: GridState, rowIndex: number, columnIndex: number): void => {
    /* 
        For some reason, there is an incredibly hard to find / track down bug where
        if you use the metaKey to scroll a huge number of cells at once, then the
        scrolls get screwed up. Specifically, this manifests as a bug where the 
        scrollLeft/scrollTop ends up getting set when it shouldn't be, and we scroll
        to where we don't want. 

        I think this is a race condition, and the simple fix is to just scroll the 
        row or column after a small timeout in the case that we move the sheet view
        some large number of rows or columns.
    */
    const largeRowJump = !isNumberInRangeInclusive(rowIndex, currentSheetView.startingRowIndex - 2, currentSheetView.startingRowIndex + currentSheetView.numRowsRendered + 1);
    const largeColumnJump = !isNumberInRangeInclusive(columnIndex, currentSheetView.startingColumnIndex - 2, currentSheetView.startingColumnIndex + currentSheetView.numColumnsRendered + 1);
    const largeJump = largeRowJump || largeColumnJump;

    // We save these both before, to try and avoid race conditions
    const rowVisible = rowIsVisible(containerDiv, rowIndex);
    const columnVisible = columnIsVisible(containerDiv, columnIndex);

    // Make the row visible
    if (!rowVisible) {
        if (!largeJump) {
            scrollRowIntoView(containerDiv, scrollAndRenderedContainerDiv, currentSheetView, rowIndex);
        } else {
            setTimeout(() => scrollRowIntoView(containerDiv, scrollAndRenderedContainerDiv, currentSheetView, rowIndex), 25)
        }
    } 

    // Make the column visible
    if (!columnVisible) {
        if (!largeJump) {
            scrollColumnIntoView(containerDiv, scrollAndRenderedContainerDiv, currentSheetView, gridState, columnIndex);
        } else {
            setTimeout(() => scrollColumnIntoView(containerDiv, scrollAndRenderedContainerDiv, currentSheetView, gridState, columnIndex), 50);
        }
    }
}

export const isCurrOpenDropdownForCell = (uiState: UIState, rowIndex: number, columnIndex: number): boolean =>  {
    return typeof uiState.currOpenDropdown == 'object' && uiState.currOpenDropdown.rowIndex === rowIndex && uiState.currOpenDropdown.columnIndex === columnIndex;
}
