/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MitoAPI } from "../../api/api";
import { ColumnID, GridState, SheetData, UIState } from "../../types";
import { TaskpaneType } from "../taskpanes/taskpanes";
import { ExploreLink } from "../../utils/cardStorage";
import CardBlockDisplay, { CardBlock } from "./CardBlockDisplay";

const GAP_PX = 6;

const SelectionCard = (props: {
    mitoAPI: MitoAPI;
    sheetDataArray: SheetData[];
    gridState: GridState;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}): JSX.Element | null => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties | undefined>(undefined);
    const [blocks, setBlocks] = useState<CardBlock[] | undefined>(undefined);
    const [explore, setExplore] = useState<ExploreLink[]>([]);
    const [openingView, setOpeningView] = useState<string | undefined>(undefined);

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
            setBlocks(undefined);
            setExplore([]);
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
                setBlocks(result.blocks);
                setExplore(result.explore ?? []);
            } else {
                setBlocks([]);
                setExplore([]);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [hasCard, sheetIndex, rowIndex, columnID, props.mitoAPI, sheetData?.columnCards]);

    const openExploreView = async (link: ExploreLink): Promise<void> => {
        if (openingView !== undefined) {
            return;
        }
        setOpeningView(link.label);
        const newSheetIndex = props.sheetDataArray.length;
        await props.mitoAPI.editAddExploreView(sheetIndex, rowIndex, link.label, link.view_code);
        props.setUIState(prevUIState => ({
            ...prevUIState,
            selectedTabType: 'data',
            selectedSheetIndex: newSheetIndex,
            currOpenTaskpane: prevUIState.currOpenTaskpane.type === TaskpaneType.GRAPH
                ? { type: TaskpaneType.NONE }
                : prevUIState.currOpenTaskpane,
        }));
        setOpeningView(undefined);
    };

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
    }, [hasCard, rowIndex, columnIndex, blocks, explore, props.gridState.scrollPosition, props.gridState.viewport, props.mitoContainerRef]);

    if (!hasCard) {
        return null;
    }

    return (
        <div
            ref={cardRef}
            className="mito-selection-card"
            style={style ?? { visibility: 'hidden' }}
        >
            {blocks === undefined
                ? <div className="mito-selection-card-loading">…</div>
                : <>
                    <CardBlockDisplay blocks={blocks} />
                    {explore.length > 0 &&
                        <div className="mito-selection-card-explore">
                            <p className="mito-selection-card-explore-title">Explore more</p>
                            <ul className="mito-selection-card-explore-links">
                                {explore.map((link) =>
                                    <li key={link.view_code + link.label}>
                                        <button
                                            type="button"
                                            className="mito-selection-card-explore-link"
                                            disabled={openingView !== undefined}
                                            onClick={() => { void openExploreView(link); }}
                                        >
                                            {link.label}
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </div>
                    }
                </>
            }
        </div>
    )
}

export default SelectionCard;
