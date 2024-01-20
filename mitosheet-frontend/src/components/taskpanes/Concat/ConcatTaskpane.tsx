import React, { useState } from "react";
import useLiveUpdatingParams from "../../../hooks/useLiveUpdatingParams";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, ColumnHeader, ConcatParams, SheetData, StepType, UIState } from "../../../types";
import { getFirstCharactersOfColumnHeaders } from "../../../utils/columnHeaders";
import DropdownButton from "../../elements/DropdownButton";
import DropdownItem from "../../elements/DropdownItem";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import Select from "../../elements/Select";
import SelectAndXIconCard from "../../elements/SelectAndXIconCard";
import Toggle from "../../elements/Toggle";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";



interface ConcatTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}

/* 
    Constructs a message that says if all the column headers in a sheet are included in the concatanated sheet. 
    If any column headers are not included, it reports them to the user.
*/
const getColumnHeadersIncludedMessage = (notIncludedColumnsArray: ColumnHeader[][], arrIndex: number): JSX.Element => {
    if (notIncludedColumnsArray[arrIndex].length === 0) {
        return (<p>&#x2713; All columns are included in the concatenated sheet.</p>)
    } 
    const [columnHeadersString, numOtherColumnHeaders] = getFirstCharactersOfColumnHeaders(notIncludedColumnsArray[arrIndex], 25)
    
    if (numOtherColumnHeaders === 0) {
        return (<p>Columns <span className='text-color-medium-important'>{columnHeadersString}</span> are not included.</p>)
    } else {
        return (<p>Columns <span className='text-color-medium-important'>{columnHeadersString}</span> and <span className='text-color-medium-important'>{numOtherColumnHeaders}</span> others are not included.</p>)
    }
}

/* 
    This taskpane allows users to concatenate two or more 
    dataframes together.
*/
const ConcatTaskpane = (props: ConcatTaskpaneProps): JSX.Element => {

    const {params, setParams} = useLiveUpdatingParams<ConcatParams, ConcatParams>(
        {
            join: 'inner',
            ignore_index: true,
            sheet_indexes: []
        },
        StepType.Concat, 
        props.mitoAPI,
        props.analysisData,
        50 // 50 ms debounce delay
    )

    // Make sure the user cannot select the newly created dataframe
    const [selectableSheetIndexes] = useState(props.sheetDataArray.map((sd, index) => index));

    // For each sheet concatonated together, find all of the columns that are not included in the final result
    const concatSheetColumnHeaders = Object.values(props.sheetDataArray[props.sheetDataArray.length - 1]?.columnIDsMap || {})
    const notIncludedColumnsArray = params?.sheet_indexes.map(sheetIndex => {
        return Object.values(props.sheetDataArray[sheetIndex]?.columnIDsMap || {}).filter(columnHeader => {
            // Because concat_edit makes a new sheet and you can't reopen the concat taskpane or reorder sheets,
            // the sheet this taskpane creates is always the last sheet in the sheetDataArray 
            return !concatSheetColumnHeaders.includes(columnHeader)
        })
    })
    
    if (params === undefined) {
        return (<DefaultEmptyTaskpane setUIState={props.setUIState} message="Import at least two datasets before concating."/>)
    }

    const dataframeCards: JSX.Element[] = params.sheet_indexes.map((sheetIndex, arrIndex) => {
        return (
            <div key={arrIndex}>
                <SelectAndXIconCard 
                    titleMap={Object.fromEntries(props.sheetDataArray.map((sheetData, index) => {
                        return [index + '', sheetData.dfName]
                    }))}
                    value={sheetIndex + ''}
                    onChange={(newSheetIndexStr) => {
                        const newSheetIndex = parseInt(newSheetIndexStr);
                        setParams(prevConcatParams => {
                            const newSheetIndexes = [...prevConcatParams.sheet_indexes];
                            newSheetIndexes[arrIndex] = newSheetIndex;

                            return {
                                ...prevConcatParams,
                                sheet_indexes: newSheetIndexes
                            }
                        })
                    }}
                    onDelete={() => {
                        setParams(prevConcatParams => {
                            const newSheetIndexes = [...prevConcatParams.sheet_indexes];
                            newSheetIndexes.splice(arrIndex, 1);

                            return {
                                ...prevConcatParams,
                                sheet_indexes: newSheetIndexes
                            }
                        })
                    }}
                    selectableValues={Object.keys(props.sheetDataArray)} // Note the cast to strings
                />
                {notIncludedColumnsArray !== undefined &&
                    <Row className='text-subtext-1'>
                        {getColumnHeadersIncludedMessage(notIncludedColumnsArray, arrIndex)}
                    </Row>
                }
            </div>
        )
    })

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Concatenate Sheet"
                setUIState={props.setUIState}            
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Join Type
                        </p>
                    </Col>
                    <Col>
                        <Select 
                            value={params.join}
                            onChange={(newJoin: string) => {
                                setParams(prevConcatParams => {
                                    return {
                                        ...prevConcatParams,
                                        join: newJoin as 'inner' | 'outer'
                                    }
                                })
                            }}
                            width='medium'
                        >
                            <DropdownItem
                                title='inner'
                                subtext="Only includes columns that exist in all sheets"
                            />
                            <DropdownItem
                                title="outer"
                                subtext="Includes all columns from all sheets, regardless of if these columns are in the other sheets."
                            />
                        </Select>
                    </Col>
                </Row>
                <Row justify='space-between' align='center'>
                    <Col>
                        <LabelAndTooltip tooltip="When on, the resulting dataframe will have indexes 0, 1, 2, etc.. This is useful if you're concatenating objects that don't have meaningful index information.">
                            Ignore Existing Indexes
                        </LabelAndTooltip>
                    </Col>
                    <Col>
                        <Toggle 
                            value={params.ignore_index}
                            onChange={() => {
                                setParams(prevConcatParams => {
                                    return {
                                        ...prevConcatParams,
                                        ignore_index: !prevConcatParams.ignore_index
                                    }
                                })
                            }}                      
                        />
                    </Col>
                </Row>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Concatenate Dataframes
                        </p>
                    </Col>
                    <Col>
                        <DropdownButton
                            text='+ Add'
                            width='small'
                            searchable
                        >   
                            {/** We allow users to select all dataframes in the sheet, as some users want this */}
                            {[
                                <DropdownItem
                                    key={-1}
                                    title="Add all sheets"
                                    onClick={() => {
                                        setParams(prevConcatParams => {
                                            const newSheetIndexes = [...selectableSheetIndexes];
                    
                                            return {
                                                ...prevConcatParams,
                                                sheet_indexes: newSheetIndexes
                                            }
                                        })
                                    }}
                                />
                            ].concat(props.sheetDataArray.filter((sheetData, index) => {
                                if (!selectableSheetIndexes.includes(index)) {
                                    return false;
                                }
                                return true;
                            }).map((sheetData, index) => {
                                return (
                                    <DropdownItem
                                        key={index}
                                        title={sheetData.dfName}
                                        onClick={() => {
                                            setParams(prevConcatParams => {
                                                const newSheetIndexes = [...prevConcatParams.sheet_indexes];
                                                newSheetIndexes.push(index);
                        
                                                return {
                                                    ...prevConcatParams,
                                                    sheet_indexes: newSheetIndexes
                                                }
                                            })
                                        }}
                                    />
                                )
                            }))}
                        </DropdownButton>
                    </Col>
                </Row>
                {dataframeCards}
            </DefaultTaskpaneBody>

        </DefaultTaskpane>
    )
}

export default ConcatTaskpane;