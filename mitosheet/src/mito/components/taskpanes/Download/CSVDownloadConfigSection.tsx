/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { MitoAPI } from "../../../api/api";
import { SheetData, UIState } from "../../../types";
import DataframeSelect from "../../elements/DataframeSelect";
import Row from "../../layout/Row";


const CSVDownloadConfigSection = (props: {
    sheetDataArray: SheetData[]
    mitoAPI: MitoAPI
    selectedSheetIndex: number
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}): JSX.Element => {

    return (
        <>
            <DataframeSelect
                title='Dataframe to Export'
                sheetDataArray={props.sheetDataArray}
                sheetIndex={props.selectedSheetIndex}
                onChange={(newSheetIndex) => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            selectedSheetIndex: newSheetIndex,
                            exportConfiguration: {exportType: 'csv'}
                        }
                    })
                }}
            />
            <Row justify='space-around'>
                <p className='ma-25px text-align-center'>
                    CSV exports will not reflect any formatting changes made in Mito.
                </p>
            </Row>
        </>
    )
}

export default CSVDownloadConfigSection;

