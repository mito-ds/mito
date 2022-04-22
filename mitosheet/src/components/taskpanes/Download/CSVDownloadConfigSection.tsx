import React from "react";
import MitoAPI from "../../../jupyter/api";
import { UIState } from "../../../types";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import Row from "../../spacing/Row";


const CSVDownloadConfigSection = (props: {
    dfNames: string[]
    mitoAPI: MitoAPI
    selectedSheetIndex: number
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
                    value={props.dfNames[props.selectedSheetIndex]}
                    onChange={(dfName) => {
                        // Note: If there are duplicated sheet names, then this only lets you select the first one
                        // We need to add SheetID
                        const dfNameIndex = props.dfNames.indexOf(dfName)
                        props.setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                selectedSheetIndex: dfNameIndex,
                                exportConfiguration: {exportType: 'csv'}
                            }
                        })
                    }}
                >
                    {...props.dfNames.map((dfName, idx) => {
                        return (
                            <DropdownItem 
                                key={idx}
                                title={dfName}
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

