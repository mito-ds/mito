import React, { useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types"
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';


import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import Row from "../../layout/Row";
import TextButton from "../../elements/TextButton";
import Col from "../../layout/Col";
import ExpandableContentCard from "../../elements/ExpandableContentCard";
import Input from "../../elements/Input";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import { getBaseOfPath } from "../UpdateImports/updateImportsUtils";
import Select from "../../elements/Select";
import DropdownItem from "../../elements/DropdownItem";
import LabelAndTooltip from "../../elements/LabelAndTooltip";


interface ExcelRangeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    file_path: string;
    sheet_name: string;
}

export type ExcelRangeImportType = 'range' | 'upper left corner value';
export type ExcelRangeRangeImport = {type: 'range', df_name: string, value: string | number};
export type ExcelRangeUpperLeftCornerValueImport = {type: 'upper left corner value', df_name: string, value: string | number, end_condition: {type: 'first empty cell'} | {type: 'bottom left corner value', value: string | number}};
export type ExcelRangeImport = ExcelRangeRangeImport | ExcelRangeUpperLeftCornerValueImport


export interface ExcelRangeImportParams {
    file_path: string,
    sheet_name: string,
    range_imports: ExcelRangeImport[],
}
const getDefaultParams = (
    file_path: string,
    sheet_name: string
): ExcelRangeImportParams | undefined => {

    return {
        file_path: file_path,
        sheet_name: sheet_name,
        range_imports: [{'type': 'range', 'df_name': '', 'value': ''}],
    }
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


    let disabledTooltip: undefined | string = undefined;
    if (params.range_imports.length === 0) {
        disabledTooltip = 'Please add range imports above before importing them.';
    } else {
        params.range_imports.forEach(rangeImport => {
            if (rangeImport.df_name === '') {
                disabledTooltip = 'Please ensure all range imports have a defined dataframe name.';
            } else if (rangeImport.value === '') {
                if (rangeImport.type === 'range') {
                    disabledTooltip = 'Please ensure all range imports have a defined range.';
                } else {
                    disabledTooltip = 'Please ensure all range imports have a defined Exact Cell Value.';
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
                <p className="text-body-3 text-overflow-wrap">Import ranges from <span className="text-bold">{props.sheet_name}</span> in <span className="text-bold">{getBaseOfPath(props.file_path)}</span>.</p>
                <Row justify="space-between">
                    <Col>
                        <p className="text-header-3">
                            Range Imports
                        </p>
                    </Col>
                    <Col span={4}>
                        <TextButton 
                            variant="dark"
                            onClick={() => {
                                setParams((prevParams) => {
                                    const newRangeImports = window.structuredClone(prevParams.range_imports);
                                    const previousType = newRangeImports.length > 0 ? newRangeImports[0].type : 'range'; // add whatever the previous range is
                                    if (previousType === 'range') {
                                        newRangeImports.unshift({'type': 'range', 'df_name': '', 'value': ''})
                                    } else {
                                        newRangeImports.unshift({'type': 'upper left corner value', 'df_name': '', 'value': '', 'end_condition': {'type': 'first empty cell'}})
                                    }
                                    return {
                                        ...prevParams,
                                        range_imports: newRangeImports
                                    }
                                })
                                setExpandedIndex(0); // expand it!
                            }}
                            width='block'
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
                            subtitle={range_import.value === '' ? 'Unselected Range' : `Range ${range_import.value}`}
                            
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
                            <Row justify="space-between">
                                <Col>
                                    <p>
                                        Dataframe Name
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
                            <Row justify="space-between">
                                <Col>
                                    <p>
                                        Locate Dataframe By
                                    </p>
                                </Col>
                                <Col>
                                    <Select
                                        width="medium"
                                        value={range_import.type}
                                        onChange={(newType) => {
                                            setParams((prevParams) => {
                                                const isNew = prevParams.range_imports[index].type !== newType;
                                                const newRangeImports: ExcelRangeImport[] = window.structuredClone(prevParams.range_imports);

                                                const newRangeImportType = newType as ExcelRangeImportType;  

                                                const previousRangeImport = prevParams.range_imports[index];
                                                let newRangeImport = prevParams.range_imports[index];
                                                
                                                if (newRangeImportType === 'range') {
                                                    newRangeImport = {
                                                        'type': newRangeImportType,
                                                        'df_name': previousRangeImport.df_name,
                                                        'value': isNew ? '' : previousRangeImport.df_name,
                                                    }
                                                } else {
                                                    newRangeImport = {
                                                        'type': newRangeImportType,
                                                        'df_name': previousRangeImport.df_name,
                                                        'value': isNew ? '' : previousRangeImport.df_name,
                                                        'end_condition': {'type': 'first empty cell'}
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
                                            title="Upper Left Corner"
                                            id='upper left corner value'
                                            subtext="Give the value in the upper left corner of the table to import."
                                        />
                                        
                                    </Select>
                                </Col>
                            </Row>
                            <Row justify="space-between" align="center">
                                <Col>
                                    <LabelAndTooltip 
                                        textBody
                                        tooltip={
                                            range_import.type === 'range' 
                                                ? "The proper format is COLUMNROW:COLUMNROW. For example, A1:B10, C10:G1000." 
                                                : 'Mito will attempt to find the cell with this exact value. Only strings and numbers are supported currently.'
                                        }
                                    >
                                        {range_import.type === 'range' ? "Excel Range" : 'Exact Cell Value'}
                                    </LabelAndTooltip>
                                </Col>
                                <Col>
                                    <Input
                                        width="medium"
                                        placeholder={range_import.type === 'range' ? "A10:C100" : 'id_abc123'}
                                        value={'' + range_import.value}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setParams((prevParams) => {
                                                const newRangeImports = window.structuredClone(prevParams.range_imports);
                                                const newRangeImport = newRangeImports[index];
                                                newRangeImport.value = newValue;
                                                return {
                                                    ...prevParams,
                                                    range_imports: newRangeImports
                                                }
                                            })
                                        }}
                                    />
                                </Col>
                            </Row>
                            {range_import.type === 'upper left corner value' && 
                                <>
                                    <Row justify="space-between">
                                        <Col>
                                            <p>
                                                Table End Condition
                                            </p>
                                        </Col>
                                        <Col>
                                            <Select
                                                width="medium"
                                                value={range_import.end_condition.type}
                                                onChange={(newType) => {
                                                    setParams((prevParams) => {
                                                        const newRangeImports = window.structuredClone(prevParams.range_imports);
                                                        const newRangeImport: ExcelRangeUpperLeftCornerValueImport = window.structuredClone(range_import);

                                                        if (newType === 'first empty cell') {
                                                            newRangeImport.end_condition = {'type': newType}
                                                        } else {
                                                            newRangeImport.end_condition = {'type': 'bottom left corner value', value: ''}

                                                        }

                                                        newRangeImports[index] = newRangeImport;

                                                        return {
                                                            ...prevParams,
                                                            range_imports: newRangeImports,
                                                        }
                                                    })
                                                }}
                                            >
                                                <DropdownItem
                                                    title='First Empty Cell'
                                                    id='first empty cell'
                                                    subtext="Mito will continue take all rows until it hits an empty cell."
                                                />
                                                <DropdownItem
                                                    title="Bottom Left Corner"
                                                    id='bottom left corner value'
                                                    subtext="Give the value in the bottom left corner of the table to import, and Mito will find the end of the table."
                                                />
                                                
                                            </Select>
                                        </Col>
                                    </Row>
                                    {range_import.end_condition.type === 'bottom left corner value' &&
                                    
                                        <Row justify="space-between" align="center">
                                            <Col>
                                                <LabelAndTooltip 
                                                    textBody
                                                    tooltip="The end of the dataframe will be detected when this value is found in the first column"
                                                >
                                                    Bottom Left Corner Value
                                                </LabelAndTooltip>
                                            </Col>
                                            <Col>
                                                <Input
                                                    width="medium"
                                                    placeholder={'final value'}
                                                    value={'' + range_import.end_condition.value}
                                                    onChange={(e) => {
                                                        const newValue = e.target.value;
                                                        setParams((prevParams) => {
                                                            const newRangeImports = window.structuredClone(prevParams.range_imports);
                                                            const newRangeImport: ExcelRangeUpperLeftCornerValueImport = window.structuredClone(range_import);
                                                            if (newRangeImport.end_condition.type === 'bottom left corner value') {
                                                                newRangeImport.end_condition.value = newValue;
                                                            } 

                                                            newRangeImports[index] = newRangeImport;
                                                            
                                                            return {
                                                                ...prevParams,
                                                                range_imports: newRangeImports
                                                            }
                                                        })
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                    }
                                </>
                            
                            
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

                                if (finalRangeImport.type === 'upper left corner value' && typeof finalRangeImport.value === 'string') {
                                    const parsedValue = parseFloat(finalRangeImport.value);
                                    if (!isNaN(parsedValue)) {
                                        finalRangeImport = {
                                            ...rangeImport,
                                            value: parsedValue
                                        }
                                    }
                                }

                                if (finalRangeImport.type === 'upper left corner value' && finalRangeImport.end_condition.type === 'bottom left corner value' && typeof finalRangeImport.end_condition.value === 'string') {
                                    const parsedValue = parseFloat(finalRangeImport.end_condition.value);
                                    if (!isNaN(parsedValue)) {
                                        finalRangeImport = {
                                            ...finalRangeImport,
                                            end_condition: {
                                                ...finalRangeImport.end_condition,
                                                value: parsedValue
                                            }
                                        }
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