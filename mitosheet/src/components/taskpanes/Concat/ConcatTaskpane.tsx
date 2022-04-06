import React, { useState } from "react";
import MitoAPI from "../../../api";
import useSyncedParams from "../../../hooks/useSyncedParams";
import { AnalysisData, ConcatParams, SheetData, StepType, UIState } from "../../../types"
import DropdownButton from "../../elements/DropdownButton";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import SelectAndXIconCard from "../../elements/SelectAndXIconCard";
import Toggle from "../../elements/Toggle";
import Col from "../../spacing/Col";
import Row from "../../spacing/Row";
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
    This taskpane allows users to concatenate two or more 
    dataframes together.
*/
const ConcatTaskpane = (props: ConcatTaskpaneProps): JSX.Element => {

    const {params, setParams} = useSyncedParams<ConcatParams>(
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
    const notIncludedColumnsArray = params?.sheet_indexes.map(sheetIndex => {
        return Object.values(props.sheetDataArray[sheetIndex].columnIDsMap).filter(columnHeader => {
            // Because concat_edit makes a new sheet and you can't reopen the concat taskpane or reorder sheets,
            // the sheet this taskpane creates is always the last sheet in the sheetDataArray 
            return !Object.values(props.sheetDataArray[props.sheetDataArray.length - 1].columnIDsMap).includes(columnHeader)
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
                    <Row className='text-subtext-1' >
                        {notIncludedColumnsArray[sheetIndex].length === 0 ? `\u2713 All columns are included in the concatenated sheet` : 
                            notIncludedColumnsArray[sheetIndex].length < 4 ? `Columns ${notIncludedColumnsArray[sheetIndex].join(', ')} are not included` :
                                `Columns ${notIncludedColumnsArray[sheetIndex].slice(0,3).join(', ')} and ${notIncludedColumnsArray[sheetIndex].length} others are not included`
                        }
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
                        <p className='text-header-3'>
                            Ignore Existing Indexes
                        </p>
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
                            Dataframes to Concatenate
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