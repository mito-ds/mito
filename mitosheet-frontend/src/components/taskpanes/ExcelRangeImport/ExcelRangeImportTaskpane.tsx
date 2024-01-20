import React, { useState } from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { MitoAPI } from "../../../api/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";


import DropdownItem from "../../elements/DropdownItem";
import ExpandableContentCard from "../../elements/ExpandableContentCard";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import TextButton from "../../elements/TextButton";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import ExcelRangeImportDynamic from "./ExcelRangeDynamicImportSection";
import ExcelRangeRangeSection from "./ExcelRangeRangeSection";
import ExcelRangeSheetSelection from "./ExcelRangeSheetSelection";


interface ExcelRangeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    file_path: string;
    sheet_name: string;
    sheet_names: string[];
}

// We have a relatively complex type for the Excel Range Import params, so we define it here.


export type ExcelRangeImportType = 'range' | 'dynamic';

export type ExcelRangeStartCondition = {type: 'upper left corner value', value: string | number} | {type: 'upper left corner value starts with', value: string | number} | {type: 'upper left corner value contains', value: string | number};
export type ExcelRangeEndCondition = {type: 'first empty cell'} | {type: 'bottom left corner value', value: string | number} | {type: 'bottom left corner value starts with', value: string | number} | {type: 'bottom left corner value contains', value: string | number} | {type: 'bottom left corner consecutive empty cells', value: string | number};
export type ExcelRangeColumnEndCondition = {type: 'first empty cell'} | {type: 'num columns', value: string | number};

export type ExcelRangeRangeImport = {type: 'range', df_name: string, value: string | number};
export type ExcelRangeDynamicImport = {
    type: 'dynamic'
    df_name: string, 
    start_condition: ExcelRangeStartCondition
    end_condition: ExcelRangeEndCondition
    column_end_condition: ExcelRangeColumnEndCondition
};

export type ExcelRangeImport = ExcelRangeRangeImport | ExcelRangeDynamicImport

export type Sheet = {
    type: 'sheet name',
    value: string
} | {
    type: 'sheet index',
    value: number
}

export interface ExcelRangeImportParams {
    file_path: string,
    sheet: Sheet,
    range_imports: ExcelRangeImport[],
    convert_csv_to_xlsx: boolean
}

const getDefaultParams = (
    file_path: string,
    sheet_name: string
): ExcelRangeImportParams | undefined => {

    return {
        file_path: file_path,
        sheet: {
            type: 'sheet name',
            value: sheet_name
        },
        range_imports: [{'type': 'range', 'df_name': '', 'value': ''}],
        convert_csv_to_xlsx: !file_path.endsWith('xlsx') && !file_path.endsWith('xlsm')
    }
}

function castConditionValueToNumberIfPossible<T extends ExcelRangeStartCondition | ExcelRangeEndCondition | ExcelRangeColumnEndCondition>(condition: T):  T {
    // If there is a value, and it is a string, try to cast it to a number
    if ('value' in condition) {
        const value = condition.value;
        if (typeof value === 'string') {
            const parsedValue = parseFloat(value);
            const isOnlyNumber = /^[+-]?\d+(\.\d+)?$/.test(value);
            if (!isNaN(parsedValue) && isOnlyNumber) {
                return {
                    ...condition,
                    value: parsedValue
                }
            }
        } else {
            return condition;
        }
    }
    return condition;

}


/* 
    This is the Excel Range Import taskpane, which allows a user to import
    multiple ranges from a single taskpane.
*/
const ExcelRangeImportTaskpane = (props: ExcelRangeImportTaskpaneProps): JSX.Element => {

    const {params, setParams, edit, error} = useSendEditOnClick<ExcelRangeImportParams, undefined>(
        () => getDefaultParams(props.file_path, props.sheet_name),
        StepType.ExcelRangeImport, 
        props.mitoAPI,
        props.analysisData,
        {overwiteStepIfClickedMultipleTimes: true}
    )
    const [expandedIndex, setExpandedIndex] = useState(0);


    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    let sheet_name: string | undefined = ''
    if (params.sheet.type === 'sheet name') {
        sheet_name = params.sheet.value;
    } else {
        sheet_name = props.sheet_names[params.sheet.value < 0 ? props.sheet_names.length + params.sheet.value : params.sheet.value];
    }


    let disabledTooltip: undefined | string = undefined;
    if (params.range_imports.length === 0) {
        disabledTooltip = 'Please add range imports above before importing them.';
    } else if (sheet_name === undefined) {
        disabledTooltip = 'Select a sheet to import from. The sheet index is out of bounds.';
    } else {
        params.range_imports.forEach(rangeImport => {
            if (rangeImport.df_name === '') {
                disabledTooltip = 'Please ensure all range imports have a defined dataframe name.';
            } 

            // Then, we check if the values in any of the conditions are empty
            if (rangeImport.type === 'dynamic') {
                if ('value' in rangeImport.start_condition && rangeImport.start_condition.value === '') {
                    disabledTooltip = 'Please ensure all range imports have a defined start condition.';
                }
                if ('value' in rangeImport.end_condition && rangeImport.end_condition.value === '') {
                    disabledTooltip = 'Please ensure all range imports have a defined row end condition.';
                }
                if ('value' in rangeImport.column_end_condition && rangeImport.column_end_condition.value === '') {
                    disabledTooltip = 'Please ensure all range imports have a defined column end condition.';
                }
            } else {
                if (rangeImport.value === '') {
                    disabledTooltip = 'Please ensure all range imports have a defined range.';
                }
            }
        })
    }
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Excel Range Import"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <ExcelRangeSheetSelection
                    params={params}
                    setParams={setParams}
                    sheet_names={props.sheet_names}
                    sheet_name={sheet_name}
                />
                <Row justify="space-between">
                    <Col>
                        <p className="text-header-3">
                            Range Imports
                        </p>
                    </Col>
                    <Col>
                        <TextButton 
                            variant="dark"
                            onClick={() => {
                                setParams((prevParams) => {
                                    const newRangeImports = window.structuredClone(prevParams.range_imports);
                                    const previousType = newRangeImports.length > 0 ? newRangeImports[0].type : 'range'; // add whatever the previous range is
                                    if (previousType === 'range') {
                                        newRangeImports.unshift({'type': 'range', 'df_name': '', 'value': ''})
                                    } else {
                                        newRangeImports.unshift({'type': 'dynamic', 'df_name': '', 'start_condition': {'type': 'upper left corner value', 'value': ''}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}})
                                    }
                                    return {
                                        ...prevParams,
                                        range_imports: newRangeImports
                                    }
                                })
                                setExpandedIndex(0); // expand it!
                            }}
                            width='small'
                        >
                            + Add
                        </TextButton>
                    </Col>
                </Row>
                {error !== undefined && 
                    <p className="text-color-error">{error}</p>
                }
                {params.range_imports.map((range_import, index) => {
                    return (
                        <ExpandableContentCard
                            key={index}
                            title={range_import.df_name === '' ? 'Unnamed dataframe' : `Importing ${range_import.df_name}`}
                            subtitle='Expand to configure range import.'
                            
                            expandedTitle='Edit Range Import'

                            isExpanded={index === expandedIndex}
                            setExpanded={(newIsExpanded) => {
                                if (newIsExpanded) {
                                    setExpandedIndex(index);
                                } else {
                                    setExpandedIndex(-1);
                                }
                            }}

                            onDelete={() => {
                                setParams((prevParams) => {
                                    const newRangeImports = window.structuredClone(prevParams.range_imports);
                                    newRangeImports.splice(index, 1);
                                    return {
                                        ...prevParams,
                                        range_imports: newRangeImports
                                    }
                                })

                                if (expandedIndex >= index) {
                                    setExpandedIndex(expandedIndex - 1);
                                }
                            }}
                        >
                            <Row justify="space-between" align="center">
                                <Col>
                                    <p className="text-body-1">
                                        Name
                                    </p>
                                </Col>
                                <Col>
                                    <Input
                                        width="medium"
                                        autoFocus
                                        placeholder="company_ids"
                                        value={range_import.df_name}
                                        onChange={(e) => {
                                            const newDfName = e.target.value;
                                            setParams((prevParams) => {
                                                const newRangeImports = window.structuredClone(prevParams.range_imports);
                                                newRangeImports[index].df_name = newDfName;
                                                return {
                                                    ...prevParams,
                                                    range_imports: newRangeImports
                                                }
                                            })
                                        }}
                                    />
                                </Col>
                            </Row>
                            <Row justify="space-between" align="center">
                                <Col>
                                    <p className="text-body-1">
                                        Locate By
                                    </p>
                                </Col>
                                <Col>
                                    <Select
                                        width="medium"
                                        value={range_import.type}
                                        onChange={(newType) => {
                                            setParams((prevParams) => {
                                                const newRangeImports: ExcelRangeImport[] = window.structuredClone(prevParams.range_imports);

                                                const newRangeImportType = newType as ExcelRangeImportType;  

                                                const previousRangeImport = prevParams.range_imports[index];
                                                let newRangeImport = prevParams.range_imports[index];
                                                
                                                if (newRangeImportType === 'range') {
                                                    newRangeImport = {
                                                        'type': newRangeImportType,
                                                        'df_name': previousRangeImport.df_name,
                                                        'value': 'value' in previousRangeImport? previousRangeImport.value : '',
                                                    }
                                                } else {
                                                    newRangeImport = {
                                                        'type': 'dynamic',
                                                        'df_name': previousRangeImport.df_name,
                                                        'start_condition': {'type': 'upper left corner value', 'value': ''},
                                                        'end_condition': {'type': 'first empty cell'},
                                                        'column_end_condition': {'type': 'first empty cell'},
                                                    }
                                                }

                                                newRangeImports[index] = newRangeImport

                                                return {
                                                    ...prevParams,
                                                    range_imports: newRangeImports,
                                                }
                                            })
                                        }}
                                    >
                                        <DropdownItem
                                            title='Exact Range'
                                            id='range'
                                            subtext="Specify the exact range to import as a sheet."
                                        />
                                        <DropdownItem
                                            title="Dynamic"
                                            id='Dynamic'
                                            subtext="Specify values and dynamic conditions to find the bounds of the data."
                                        />
                                        
                                    </Select>
                                </Col>
                            </Row>
                            <Spacer px={10} seperatingLine/>
                            {range_import.type === 'range' && 
                                <ExcelRangeRangeSection
                                    rangeImport={range_import}
                                    index={index}
                                    setParams={setParams}
                                />
                            }
                            {range_import.type === 'dynamic' &&
                                <ExcelRangeImportDynamic
                                    rangeImport={range_import}
                                    index={index}
                                    setParams={setParams}
                                />
                            }
                        </ExpandableContentCard>
                    )
                })}
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => {
                        edit((params) => {
                            // Before we edit, we turn any values that are numbers directly into numbers. This ensures
                            // that we find the values when we search through the Excel sheet, if we can

                            const finalRangeImports: ExcelRangeImport[] = params.range_imports.map((rangeImport) => {

                                let finalRangeImport = rangeImport;

                                if (finalRangeImport.type === 'dynamic') {
                                    const startCondition = castConditionValueToNumberIfPossible(finalRangeImport.start_condition);
                                    const endCondition = castConditionValueToNumberIfPossible(finalRangeImport.end_condition);
                                    const columnEndCondition = castConditionValueToNumberIfPossible(finalRangeImport.column_end_condition);     
                                    
                                    finalRangeImport = {
                                        ...finalRangeImport,
                                        start_condition: startCondition,
                                        end_condition: endCondition,
                                        column_end_condition: columnEndCondition,
                                    }
                                }

                                return finalRangeImport;
                            });

                            // We then reverse the range imports, so they appear in the order that they were added
                            finalRangeImports.reverse()

                            return {
                                ...params,
                                range_imports: finalRangeImports
                            }
                        });
                    }}
                    disabled={disabledTooltip !== undefined}
                    disabledTooltip={disabledTooltip}
                >
                    Import Ranges
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default ExcelRangeImportTaskpane;