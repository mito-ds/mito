import React from "react";
import MitoAPI from "../../../api";
import { ColumnMitoType, ExcelExportState, FormatType, SheetData, UIState } from "../../../types";
import { removeIfPresent, toggleInArray } from "../../../utils/arrays";
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import { changeFormatOfColumnID, getColumnFormatDropdownItemsUsingColumnID, getFormatTitle } from "../../../utils/formatColumns";
import DropdownButton from "../../elements/DropdownButton";
import DropdownItem from "../../elements/DropdownItem";
import MultiToggleBox from "../../elements/MultiToggleBox";
import MultiToggleItem from "../../elements/MultiToggleItem";
import Select from "../../elements/Select";
import XIcon from "../../icons/XIcon";
import Col from "../../spacing/Col";
import Row from "../../spacing/Row";

const ExcelDownloadConfigSection = (props: {
    dfNames: string[]
    mitoAPI: MitoAPI
    sheetDataArray: SheetData[]
    exportState: ExcelExportState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    newlyFormattedColumns: Record<number, string[]>
    setNewlyFormattedColumns: React.Dispatch<React.SetStateAction<Record<number, string[]>>>
}): JSX.Element => {

    // Returns the approporiate disabled message, not letting the user format a non-number column or a column that already has formatting
    const getFormatAddDisabledMessage = (columnID: string, exportedSheetIndex: number): string => {
        const columnMitoType = props.sheetDataArray[exportedSheetIndex].columnMitoTypeMap[columnID]
        return columnMitoType !== ColumnMitoType.NUMBER_SERIES ? 'Formatting is only available for number columns.' :
            props.sheetDataArray[exportedSheetIndex].columnFormatTypeObjMap[columnID].type != FormatType.DEFAULT ? 'This column already has a format applied to it. Find it in the list below.' : ''
    }

    return (
        <>
            <p className='text-header-3'>
                Sheets to Export
            </p> 
            <MultiToggleBox
                width='block'
                height='small'
            >
                {props.dfNames.map((dfName, index) => {
                    return (
                        <MultiToggleItem
                            key={index}
                            title={dfName}
                            toggled={props.exportState.sheetIndexes.includes(index)}
                            index={index}
                            onToggle={() => { 
                                props.setUIState(prevUIState => {
                                    const newSheetIndexes = [...props.exportState.sheetIndexes]
                                    toggleInArray(newSheetIndexes, index); // Toggle the index
                                    newSheetIndexes.sort() // Make sure these are in the right order;

                                    return {
                                        ...prevUIState,
                                        exportConfiguration: {exportType: 'excel', sheetIndexes: newSheetIndexes}
                                    }
                                })
                            }}
                        />
                    ) 
                })}
            </MultiToggleBox>
            <Row justify='space-around'>
                <p className='ma-25px text-align-center'>
                    To preserve formatting while exporting to Excel, upgrade to <a className='text-underline' href='https://www.trymito.io/plans' target='_blank' rel="noreferrer">Mito Pro</a>.
                </p>
            </Row>

            {/* 
                For sheets that are going to be exported, 
                display all of the columns that have formatting applied to them, 
                and let the user change / add new formatting before exporting. 

                It is currently wrapped in {false && ... } until we deploy our first pro features.
            */}
            {false && 
                props.exportState.sheetIndexes.map(exportedSheetIndex => {
                    const columnIDsMap = props.sheetDataArray[exportedSheetIndex].columnIDsMap
    
                    const newlyFormattedColumns = Object.keys(props.newlyFormattedColumns).length >= exportedSheetIndex ? props.newlyFormattedColumns[exportedSheetIndex] : []
                    const columnFormatTypeObjMap = Object.entries(props.sheetDataArray[exportedSheetIndex].columnFormatTypeObjMap).filter(([,formatTypeObj]) => {
                        // Filter out any column with default formatting, which is most!
                        return formatTypeObj.type !== FormatType.DEFAULT
                    }).sort(([columnIDOne,], [columnIDTwo,]) => {
                        // Sort the columns to be dispalyed such that the newest columns that the user
                        // formats using this taskpane are shown at the top
                        const idxOne = newlyFormattedColumns.indexOf(columnIDOne)
                        const idxTwo = newlyFormattedColumns.indexOf(columnIDTwo)
                        if (idxOne >= 0 && idxTwo === -1) {
                            return -1
                        } else if (idxOne === -1 && idxTwo >= 0) {
                            return 1 
                        } else if (idxOne === -1 && idxTwo === -1) {
                            return 0 
                        } else {
                            return idxOne < idxTwo ? -1 : 1
                        }
                    })    
                    return (
                        <div key={exportedSheetIndex} className='mt-10px'>
                            <Row justify='space-between' align='center'>
                                <Col span={16}>
                                    <p className='text-header-3'>
                                        {props.dfNames[exportedSheetIndex]} formatting
                                    </p> 
                                </Col>
                                <DropdownButton 
                                    text='+ Format'
                                    width={'small'}
                                    searchable={true}
                                >
                                    {Object.keys(props.sheetDataArray[exportedSheetIndex].columnIDsMap).map(columnID => {
                                        const columnHeader = getDisplayColumnHeader(columnIDsMap[columnID])
                                        const disabledText = getFormatAddDisabledMessage(columnID, exportedSheetIndex)
    
                                        return (
                                            <DropdownItem
                                                key={exportedSheetIndex.toString() + columnHeader} // sheetIndex + columnHeader is unique in Mito
                                                title={columnHeader}
                                                onClick={() => {
                                                    props.setNewlyFormattedColumns(prevNewlyFormattedColumns => {
                                                        // Add the columnID to the front of the list so it is displayed at the top
                                                        const copySheetNewlyFormattedColumns = [...prevNewlyFormattedColumns[exportedSheetIndex]]
                                                        copySheetNewlyFormattedColumns.unshift(columnID)
                                                        prevNewlyFormattedColumns[exportedSheetIndex] = copySheetNewlyFormattedColumns
                                                        return prevNewlyFormattedColumns
                                                    })
                                                    void changeFormatOfColumnID(exportedSheetIndex, columnID, {type: FormatType.PLAIN_TEXT}, props.mitoAPI)
                                                }}
                                                disabled={disabledText !== ''}
                                                hideSubtext={true}
                                                displaySubtextOnHover={true}
                                                subtext={disabledText}
                                            />
                                        )
                                    })}
                                </DropdownButton>
                            </Row>
                        
                            {/* 
                                Display each column in the sheet that has formatting applied to it. 
                                Let the user change the column, the formatting, or delete the formatting all together.
                            */}
                            {columnFormatTypeObjMap.map(([columnID, columnFormatTypeObj]) => {
                                const columnHeader = getDisplayColumnHeader(columnIDsMap[columnID])
                                const columnMitoType = props.sheetDataArray[exportedSheetIndex].columnMitoTypeMap[columnID]
                                
                                return(
                                    <Row 
                                        justify='space-between'
                                        align='center'
                                        key={exportedSheetIndex.toString() + columnHeader}
                                    >
                                        <Select 
                                            value={columnHeader}
                                            width={'medium'}
                                            onChange={(newColumnID) => {
                                                /*
                                                    If the user uses the select to change the column header that a formatting is applied to:
                                                    2. set the previous columnID to have DEFAULT formatting
                                                    3. set the new columnID to have the formatting that was previously applied
                                                */
                                                
                                                // Get rid of the formatting from the previous column that was selected
                                                void changeFormatOfColumnID(exportedSheetIndex, columnID, {type: FormatType.DEFAULT}, props.mitoAPI)
                                                // Add the previous column's formatting to the new column
                                                void changeFormatOfColumnID(exportedSheetIndex, newColumnID, columnFormatTypeObj, props.mitoAPI)
                                            }}
                                        >
                                            {Object.keys(props.sheetDataArray[exportedSheetIndex].columnIDsMap).map(columnID => {
                                                const columnHeader = getDisplayColumnHeader(columnIDsMap[columnID])
                                                const disabledText = getFormatAddDisabledMessage(columnID, exportedSheetIndex)
    
                                                return (
                                                    <DropdownItem
                                                        key={exportedSheetIndex.toString() + columnHeader} // sheetIndex + columnHeader is unique in Mito
                                                        id={columnID}
                                                        title={columnHeader}
                                                        disabled={disabledText !== ''}
                                                        hideSubtext={true}
                                                        displaySubtextOnHover={true}
                                                        subtext={disabledText}
                                                    />
                                                )
                                            })}
                                        </Select>
                                        <Select
                                            value={getFormatTitle(columnFormatTypeObj)}
                                            width='medium'
                                        >
                                            {getColumnFormatDropdownItemsUsingColumnID(exportedSheetIndex, columnID, props.mitoAPI, columnMitoType, props.sheetDataArray[exportedSheetIndex], false)}
                                        </Select>
                                        <Col offsetRight={1}>
                                            <div className='default-taskpane-header-exit-button-div' onClick={() => {
                                                // If the columnID is included in the list of newly formatted columns, remove it. 
                                                props.setNewlyFormattedColumns(prevNewlyFormattedColumns => {
                                                    const copySheetNewlyFormattedColumns = [...prevNewlyFormattedColumns[exportedSheetIndex]]
                                                    removeIfPresent(copySheetNewlyFormattedColumns, columnID)
                                                    return {...prevNewlyFormattedColumns, exportedSheetIndex: copySheetNewlyFormattedColumns}
                                                })
                                                // Actually set the format of the column to default 
                                                void changeFormatOfColumnID(exportedSheetIndex, columnID, {type: FormatType.DEFAULT}, props.mitoAPI)
                                            }}>
                                                <XIcon/>
                                            </div>
                                        </Col>
                                    </Row>
                                )
                            })}
                            {columnFormatTypeObjMap.length == 0 &&
                                <Row justify='space-around'>
                                    <p className='ma-25px text-align-center'>
                                        There is no formatting applied to this sheet.
                                    </p>
                                </Row>
                            }
                        </div>
                    )
                })
            }
        </>
    )
}

export default ExcelDownloadConfigSection;

