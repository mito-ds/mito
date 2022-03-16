import React from "react";
import MitoAPI from "../../../api";
import { DataframeID, SheetData, UIState } from "../../../types";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import Row from "../../spacing/Row";


const CSVDownloadConfigSection = (props: {
    sheetDataMap: Record<DataframeID, SheetData>;
    mitoAPI: MitoAPI
    selectedDataframeID: DataframeID
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}): JSX.Element => {

    return (
        <>
            <Row justify='space-between' align='center'>
                <p className='text-header-3'>
                    Sheet to Export
                </p>
                <Select 
                    width='medium'
                    value={props.selectedDataframeID}
                    onChange={(dataframeID) => {
                        // TODO: test this
                        // Note: If there are duplicated sheet names, then this only lets you select the first one
                        // We need to add SheetID
                        props.setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                selectedDataframeID: dataframeID,
                                exportConfiguration: {exportType: 'csv'}
                            }
                        })
                    }}
                >
                    {Object.entries(props.sheetDataMap).map(([dataframeID, sheetData]) => {
                        return (
                            <DropdownItem 
                                key={dataframeID}
                                title={sheetData.dfName}
                                id={dataframeID}
                            />
                        )
                    })}
                </Select>
            </Row>
            <Row justify='space-around'>
                <p className='ma-25px text-align-center'>
                    CSV exports will not reflect any formatting changes made in Mito.
                </p>
            </Row>
        </>
    )
}

export default CSVDownloadConfigSection;

