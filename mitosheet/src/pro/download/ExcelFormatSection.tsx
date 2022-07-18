import React from "react";
import MitoAPI from "../../jupyter/api";
import { ExcelExportState, FormatType, SheetData } from "../../components/../types";
import { removeIfPresent } from "../../components/../utils/arrays";
import { getDisplayColumnHeader } from "../../components/../utils/columnHeaders";
import { changeFormatOfColumnID, getColumnFormatDropdownItemsUsingColumnID, getFormatTitle } from "../../components/../utils/formatColumns";
import DropdownButton from "../../components/elements/DropdownButton";
import DropdownItem from "../../components/elements/DropdownItem";
import Select from "../../components/elements/Select";
import XIcon from "../../components/icons/XIcon";
import Col from "../../components/layout/Col";
import Row from "../../components/layout/Row";
import { isNumberDtype } from "../../utils/dtypes";

const ExcelFormatSection = (props: {
    dfNames: string[]
    mitoAPI: MitoAPI
    sheetDataArray: SheetData[]
    exportState: ExcelExportState;
    newlyFormattedColumns: Record<number, string[]>
    setNewlyFormattedColumns: React.Dispatch<React.SetStateAction<Record<number, string[]>>>
}): JSX.Element => {

    // Returns the approporiate disabled message, not letting the user format a non-number column or a column that already has formatting
    const getFormatAddDisabledMessage = (columnID: string, exportedSheetIndex: number): string => {
        const columnDtype = props.sheetDataArray[exportedSheetIndex]?.columnDtypeMap[columnID] || '';
        return !isNumberDtype(columnDtype) ? 'Formatting is only available for number columns.' :
            props.sheetDataArray[exportedSheetIndex].columnFormatTypeObjMap[columnID].type != FormatType.DEFAULT ? 'This column already has a format applied to it. Find it in the list below.' : ''
    }

    return (
        <>
            {props.exportState.sheetIndexes.map(exportedSheetIndex => {
                const columnIDsMap = props.sheetDataArray[exportedSheetIndex].columnIDsMap

                const newlyFormattedColumns = Object.keys(props.newlyFormattedColumns || {}).length >= exportedSheetIndex ? props.newlyFormattedColumns[exportedSheetIndex] : []
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
                                {Object.keys(props.sheetDataArray[exportedSheetIndex]?.columnIDsMap || {}).map(columnID => {
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
                            const columnDtype = props.sheetDataArray[exportedSheetIndex]?.columnDtypeMap[columnID] || '';
                            
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
                                        {Object.keys(props.sheetDataArray[exportedSheetIndex]?.columnIDsMap || {}).map(columnID => {
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
                                        {getColumnFormatDropdownItemsUsingColumnID(exportedSheetIndex, columnID, props.mitoAPI, columnDtype, props.sheetDataArray[exportedSheetIndex], false)}
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
            })}
        </>
    )
}

export default ExcelFormatSection;

