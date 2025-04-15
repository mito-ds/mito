/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { MitoAPI } from "../../../api/api";
import { ExcelExportState, SheetData, UIState, UserProfile } from "../../../types";
import MultiToggleDataframes from "../../elements/MultiToggleDataframes";

const ExcelDownloadConfigSection = (props: {
    dfNames: string[]
    mitoAPI: MitoAPI
    userProfile: UserProfile;
    sheetDataArray: SheetData[]
    exportState: ExcelExportState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    newlyFormattedColumns: Record<number, string[]>
    setNewlyFormattedColumns: React.Dispatch<React.SetStateAction<Record<number, string[]>>>
}): JSX.Element => {

    return (
        <>
            <p className='text-header-3'>
                Dataframes to Export
            </p> 
            <MultiToggleDataframes
                sheetDataArray={props.sheetDataArray}
                selectedSheetIndexes={props.exportState.sheetIndexes}
                setUIState={props.setUIState}
                onChange={(newSelectedSheetIndexes) => {
                    props.setUIState(prevUiState => {
                        return {
                            ...prevUiState,
                            exportConfiguration: {exportType: 'excel', sheetIndexes: newSelectedSheetIndexes}
                        }
                    })
                }}
            />
        </>
    )
}

export default ExcelDownloadConfigSection;

