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


interface ExcelRangeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    file_path: string;
    sheet_name: string;
}

export type ExcelRangeImport = {type: 'range', df_name: string, range: string};

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
        range_imports: [{'type': 'range', 'df_name': '', 'range': ''}],
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
                                    const newRangeImports = [...prevParams.range_imports];
                                    newRangeImports.unshift({'type': 'range', 'df_name': '', 'range': ''}) // add to the start
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
                            subtitle={range_import.range === '' ? 'Unselected Range' : `Range ${range_import.range}`}
                            
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
                                    const newRangeImports = [...prevParams.range_imports];
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
                                        autoFocus
                                        placeholder="company_ids"
                                        value={range_import.df_name}
                                        onChange={(e) => {
                                            const newDfName = e.target.value;
                                            setParams((prevParams) => {
                                                const newRangeImports = [...prevParams.range_imports];
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
                                        Excel Range
                                    </p>
                                </Col>
                                <Col>
                                    <Input
                                        placeholder="A10:C100"
                                        value={range_import.range}
                                        onChange={(e) => {
                                            const newRange = e.target.value;
                                            setParams((prevParams) => {
                                                const newRangeImports = [...prevParams.range_imports];
                                                newRangeImports[index].range = newRange;
                                                return {
                                                    ...prevParams,
                                                    range_imports: newRangeImports
                                                }
                                            })
                                        }}
                                    />
                                </Col>
                            </Row>

                        </ExpandableContentCard>
                    )
                })}
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => {
                        edit();
                    }}
                    disabled={params.range_imports.length === 0}
                >
                    Import Ranges
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default ExcelRangeImportTaskpane;