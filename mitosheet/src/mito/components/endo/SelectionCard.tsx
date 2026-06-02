/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MitoAPI } from "../../api/api";
import { ColumnID, GridState, SheetData } from "../../types";

/*
    Renders the "at-a-glance" card for the currently selected cell. Card text is
    rendered on the backend so templates can use {Column Header} values and
    {=expression} computed fields for the selected row.
*/
const GAP_PX = 6;

const SelectionCard = (props: {
    mitoAPI: MitoAPI;
    sheetDataArray: SheetData[];
    gridState: GridState;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
}): JSX.Element | null => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties | undefined>(undefined);
    const [cardContent, setCardContent] = useState<string | undefined>(undefined);

    const sheetIndex = props.gridState.sheetIndex;
    const sheetData: SheetData | undefined = props.sheetDataArray[sheetIndex];
    const selection = props.gridState.selections[props.gridState.selections.length - 1];
    const rowIndex = selection.startingRowIndex;
    const columnIndex = selection.startingColumnIndex;

    const columnID: ColumnID | undefined = (sheetData !== undefined && rowIndex >= 0 && columnIndex >= 0)
        ? sheetData.data[columnIndex]?.columnID
        : undefined;
    const hasCard = columnID !== undefined && sheetData?.columnCards?.[columnID] !== undefined;

    useEffect(() => {
        if (!hasCard || columnID === undefined) {
            setCardContent(undefined);
            return;
        }

        let cancelled = false;
        void (async () => {
            const response = await props.mitoAPI.getCardContent(sheetIndex, rowIndex, columnID);
            if (cancelled) {
                return;
            }
            const result = 'result' in response ? response.result : undefined;
            if (result !== undefined && !('error' in result)) {
                setCardContent(result.content);
            } else {
                setCardContent('');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [hasCard, sheetIndex, rowIndex, columnID, props.mitoAPI, sheetData?.columnCards]);

    useLayoutEffect(() => {
        if (!hasCard) {
            return;
        }
        const cardEl = cardRef.current;
        const container = props.mitoContainerRef.current;
        const parent = cardEl?.offsetParent as HTMLElement | null;
        if (cardEl === null || container === null || parent === null) {
            setStyle(undefined);
            return;
        }

        const cellEl = container.querySelector(`[mito-row-index="${rowIndex}"][mito-col-index="${columnIndex}"]`);
        if (cellEl === null) {
            setStyle(undefined);
            return;
        }

        const cellRect = cellEl.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const cardWidth = cardEl.offsetWidth;
        const cardHeight = cardEl.offsetHeight;

        let left = cellRect.right - parentRect.left + GAP_PX;
        if (left + cardWidth > parentRect.width) {
            left = cellRect.left - parentRect.left - cardWidth - GAP_PX;
        }
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
    }, [hasCard, rowIndex, columnIndex, cardContent, props.gridState.scrollPosition, props.gridState.viewport, props.mitoContainerRef]);

    if (!hasCard) {
        return null;
    }

    return (
        <div
            ref={cardRef}
            className="mito-selection-card"
            style={style ?? { visibility: 'hidden' }}
        >
            <div className="mito-selection-card-body">
                {cardContent ?? '…'}
            </div>
        </div>
    )
}

export default SelectionCard;
