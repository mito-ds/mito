/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { useCardContent } from "../../../hooks/useCardContent";
import { GridState, SheetData, UIState } from "../../../types";
import { ExploreLink } from "../../../utils/cardStorage";
import CardContentView from "../../cards/CardContentView";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { TaskpaneType } from "../taskpanes";

interface CardSidebarTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    sheetDataArray: SheetData[];
    gridState: GridState;
}

const CardSidebarTaskpane = (props: CardSidebarTaskpaneProps): JSX.Element => {
    const [openingView, setOpeningView] = useState<string | undefined>(undefined);

    const sheetIndex = props.gridState.sheetIndex;
    const sheetData = props.sheetDataArray[sheetIndex];
    const selection = props.gridState.selections[props.gridState.selections.length - 1];
    const rowIndex = selection.startingRowIndex;
    const columnIndex = selection.startingColumnIndex;

    const columnID = (sheetData !== undefined && rowIndex >= 0 && columnIndex >= 0)
        ? sheetData.data[columnIndex]?.columnID
        : undefined;

    const { blocks, explore, hasCard } = useCardContent(
        props.mitoAPI,
        sheetIndex,
        rowIndex,
        columnID,
        sheetData,
        'full',
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
            currOpenTaskpane: { type: TaskpaneType.CARD_SIDEBAR },
        }));
        setOpeningView(undefined);
    };

    if (sheetData === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>;
    }

    const header = hasCard && columnID !== undefined
        ? `${sheetData.columnIDsMap[columnID]}`
        : 'Card details';

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader
                header={header}
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                {!hasCard &&
                    <p className="text-body-1">
                        Select a cell in a column that has a card to see its details here.
                    </p>
                }
                {hasCard &&
                    <div className="mito-card-sidebar-body">
                        <CardContentView
                            blocks={blocks}
                            explore={explore}
                            openingView={openingView}
                            onOpenExploreView={(link) => { void openExploreView(link); }}
                        />
                    </div>
                }
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    );
};

export default CardSidebarTaskpane;
