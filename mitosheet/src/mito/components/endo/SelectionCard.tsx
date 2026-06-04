/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useLayoutEffect, useRef, useState } from "react";
import { MitoAPI } from "../../api/api";
import { useCardContent } from "../../hooks/useCardContent";
import { ColumnID, GridState, SheetData, UIState } from "../../types";
import { ExploreLink } from "../../utils/cardStorage";
import CardContentView from "../cards/CardContentView";
import { CardBlock } from "./CardBlockDisplay";
import { OpenFullscreenIcon } from "../icons/FullscreenIcons";
import { TaskpaneType } from "../taskpanes/taskpanes";

const GAP_PX = 6;

const SelectionCard = (props: {
    mitoAPI: MitoAPI;
    sheetDataArray: SheetData[];
    gridState: GridState;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    cardSidebarOpen: boolean;
}): JSX.Element | null => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties | undefined>(undefined);
    const [openingView, setOpeningView] = useState<string | undefined>(undefined);

    const sheetIndex = props.gridState.sheetIndex;
    const sheetData: SheetData | undefined = props.sheetDataArray[sheetIndex];
    const selection = props.gridState.selections[props.gridState.selections.length - 1];
    const rowIndex = selection.startingRowIndex;
    const columnIndex = selection.startingColumnIndex;

    const columnID: ColumnID | undefined = (sheetData !== undefined && rowIndex >= 0 && columnIndex >= 0)
        ? sheetData.data[columnIndex]?.columnID
        : undefined;

    const { blocks, explore, hasCard } = useCardContent(
        props.mitoAPI,
        sheetIndex,
        rowIndex,
        columnID,
        sheetData,
        'glance',
    );

    const openExploreView = async (link: ExploreLink): Promise<void> => {
        if (openingView !== undefined || columnID === undefined) {
            return;
        }
        setOpeningView(link.label);
        const newSheetIndex = props.sheetDataArray.length;
        await props.mitoAPI.editAddExploreView(sheetIndex, rowIndex, link.label, link.view_code);
        props.setUIState(prevUIState => ({
            ...prevUIState,
            selectedTabType: 'data',
            selectedSheetIndex: newSheetIndex,
            currOpenTaskpane: prevUIState.currOpenTaskpane.type === TaskpaneType.CARD_SIDEBAR
                ? { type: TaskpaneType.CARD_SIDEBAR }
                : prevUIState.currOpenTaskpane.type === TaskpaneType.GRAPH
                    ? { type: TaskpaneType.NONE }
                    : prevUIState.currOpenTaskpane,
        }));
        setOpeningView(undefined);
    };

    const openCardSidebar = (): void => {
        props.setUIState(prevUIState => ({
            ...prevUIState,
            currOpenTaskpane: { type: TaskpaneType.CARD_SIDEBAR },
        }));
    };

    useLayoutEffect(() => {
        if (!hasCard || props.cardSidebarOpen) {
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
    }, [hasCard, props.cardSidebarOpen, rowIndex, columnIndex, blocks, explore, props.gridState.scrollPosition, props.gridState.viewport, props.mitoContainerRef]);

    if (!hasCard || props.cardSidebarOpen) {
        return null;
    }

    const expandButton = (
        <button
            type="button"
            className="mito-selection-card-expand"
            title="Open full details in sidebar"
            aria-label="Open full card details in sidebar"
            onClick={openCardSidebar}
        >
            <OpenFullscreenIcon />
        </button>
    );

    let bodyBlocks: CardBlock[] | undefined = blocks;
    let banner: JSX.Element | null = null;

    if (blocks !== undefined && blocks.length > 0 && blocks[0].type === 'header') {
        bodyBlocks = blocks.slice(1);
        banner = (
            <div className="mito-selection-card-banner">
                <div className="mito-card-header">{blocks[0].content}</div>
                {expandButton}
            </div>
        );
    }

    return (
        <div
            ref={cardRef}
            className="mito-selection-card"
            style={style ?? { visibility: 'hidden' }}
        >
            {banner}
            {banner === null && expandButton}
            <CardContentView
                blocks={bodyBlocks}
                explore={explore}
                openingView={openingView}
                onOpenExploreView={(link) => { void openExploreView(link); }}
            />
        </div>
    );
};

export default SelectionCard;
