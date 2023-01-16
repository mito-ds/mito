import React from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";
import Input from '../../elements/Input';
import Col from '../../layout/Col';
import Row from '../../layout/Row';

import DataframeMultiSelect from "../../elements/DataframeMultiSelect";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import TextButton from "../../elements/TextButton";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";


interface ExportToFileTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

interface ExportToFileParams {
    type: 'csv' | 'excel',
    sheet_indexes: number[],
    file_name: string,
}
const getDefaultParams = (
    sheetDataArray: SheetData[], 
    sheetIndex: number,
): ExportToFileParams | undefined => {

    if (sheetDataArray.length === 0 || sheetDataArray[sheetIndex] === undefined) {
        return undefined;
    }

    return {
        type: "csv",
        sheet_indexes: [sheetIndex],
        file_name: "export.csv", // TODO: append the date and time for the random file name
    }
}


/* 
    This is the Export To File taskpane.
*/
const ExportToFileTaskpane = (props: ExportToFileTaskpaneProps): JSX.Element => {

    const {params, setParams, edit} = useSendEditOnClick<ExportToFileParams, undefined>(
            () => getDefaultParams(props.sheetDataArray, props.selectedSheetIndex),
            StepType.ExportToFile, 
            props.mitoAPI,
            props.analysisData,
        )

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState} message='Please import a dataframe before attempting to export it'/>
    }
    

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Export To File"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center' title='TODO'>
                    <Col>
                        <p className='text-header-3'>
                            type
                        </p>
                    </Col>
                    <Col>
                        <Select 
                            value={params.type}
                            onChange={(newType) => {
                                setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        type: newType as 'csv' | 'excel'
                                    }
                                })
                            }}
                        >
                            <DropdownItem title="csv"/>
                            <DropdownItem title="excel"/>
                        </Select>
                    </Col>
                </Row>
                <DataframeMultiSelect
                    sheetDataArray={props.sheetDataArray}
                    selectedSheetIndexes={params.sheet_indexes}
                    setUIState={props.setUIState}
                    onChange={(newSelectedSheetIndexes) => {
                        setParams(prevParams => {
                            return {
                                ...prevParams,
                                sheet_indexes: newSelectedSheetIndexes
                            }
                        })
                    }}
                />
                <Row justify='space-between' align='center' title='TODO'>
                    <Col>
                        <p className='text-header-3'>
                            file_name
                        </p>
                    </Col>
                    <Col>
                        <Input
                            autoFocus
                            width='medium'
                            value={'' + params.file_name}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                
                                setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        file_name: newValue
                                    }
                                })
                            }}
                        />
                    </Col>
                </Row>
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => {
                        edit();
                    }}
                    disabled={params.sheet_indexes.length === 0}
                >
                    Generate Export Code
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default ExportToFileTaskpane;