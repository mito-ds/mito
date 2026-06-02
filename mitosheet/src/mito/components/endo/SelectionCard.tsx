/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useLayoutEffect, useRef, useState } from "react";
import { GridState, SheetData } from "../../types";

/*
    Renders the "at-a-glance" card for the currently selected cell. A card exists
    when the selected column has a saved template (sheetData.columnCards[columnID]).
    The template's {Column Header} placeholders are filled in with the selected
    row's values, and the card is positioned next to the selected cell.
*/
const GAP_PX = 6;

const fillTemplate = (template: string, sheetData: SheetData, rowIndex: number): string => {
    let result = template;
    sheetData.data.forEach(column => {
        const header = String(column.columnHeader);
        const value = column.columnData[rowIndex];
        const displayValue = (value === null || value === undefined) ? '' : String(value);
        result = result.split(`{${header}}`).join(displayValue);
    })
    return result;
}

const SelectionCard = (props: {
    sheetDataArray: SheetData[];
    gridState: GridState;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
}): JSX.Element | null => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties | undefined>(undefined);

    const sheetData: SheetData | undefined = props.sheetDataArray[props.gridState.sheetIndex];
    const selection = props.gridState.selections[props.gridState.selections.length - 1];
    const rowIndex = selection.startingRowIndex;
    const columnIndex = selection.startingColumnIndex;

    const columnID = (sheetData !== undefined && rowIndex >= 0 && columnIndex >= 0)
        ? sheetData.data[columnIndex]?.columnID
        : undefined;
    const template = columnID !== undefined ? sheetData?.columnCards?.[columnID] : undefined;
    const showCard = sheetData !== undefined && template !== undefined;

    useLayoutEffect(() => {
        if (!showCard) {
            return;
        }
        const cardEl = cardRef.current;
        const container = props.mitoContainerRef.current;
        const parent = cardEl?.offsetParent as HTMLElement | null;
        if (cardEl === null || container === null || parent === null) {
            setStyle(undefined);
            return;
        }

        // The selected cell is only in the DOM when it's scrolled into view
        const cellEl = container.querySelector(`[mito-row-index="${rowIndex}"][mito-col-index="${columnIndex}"]`);
        if (cellEl === null) {
            setStyle(undefined);
            return;
        }

        const cellRect = cellEl.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const cardWidth = cardEl.offsetWidth;
        const cardHeight = cardEl.offsetHeight;

        // Default: to the right of the cell, aligned with the top of the cell
        let left = cellRect.right - parentRect.left + GAP_PX;
        // If there isn't room on the right, place it to the left of the cell instead
        if (left + cardWidth > parentRect.width) {
            left = cellRect.left - parentRect.left - cardWidth - GAP_PX;
        }
        // As a last resort (very narrow sheet), clamp inside the visible area
        if (left < 0) {
            left = Math.max(GAP_PX, parentRect.width - cardWidth - GAP_PX);
        }

        let top = cellRect.top - parentRect.top;
        if (top + cardHeight > parentRect.height) {
            top = Math.max(GAP_PX, parentRect.height - cardHeight - GAP_PX);
        }
        if (top < 0) {
            top = GAP_PX;
        }

        setStyle({ top, left });
    }, [showCard, rowIndex, columnIndex, template, props.gridState.scrollPosition, props.gridState.viewport, props.mitoContainerRef]);

    if (!showCard) {
        return null;
    }

    return (
        <div
            ref={cardRef}
            className="mito-selection-card"
            // Hide until positioned to avoid a flash in the wrong spot
            style={style ?? { visibility: 'hidden' }}
        >
            <div className="mito-selection-card-body">
                {fillTemplate(template, sheetData, rowIndex)}
            </div>
        </div>
    )
}

export default SelectionCard;
