import React, { useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";
import Col from '../../layout/Col';
import Row from '../../layout/Row';

import useSendEditOnClickNoParams from "../../../hooks/useSendEditOnClickNoParams";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import TextButton from "../../elements/TextButton";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";


interface UserDefinedImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

interface UserDefinedImportParams {
    importer: string,
}
const getDefaultParams = (
    analysisData: AnalysisData,
): UserDefinedImportParams | undefined => {

    if (analysisData.userDefinedImporters.length === 0) {
        return undefined
    }


    // Otherwise, return the first importer
    return {
        importer: analysisData.userDefinedImporters[0].name
    }
}

const NO_IMPORTERS_MESSAGE = 'You have not defined any importers. To define importers, pass them to the mitosheet.sheet call with the `importers` parameter. An importer is just a function that returns a pandas dataframe.';

/* 
    This is the UserDefinedImport taskpane.
*/
const UserDefinedImportTaskpane = (props: UserDefinedImportTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultParams(props.analysisData));

    const {edit} = useSendEditOnClickNoParams<UserDefinedImportParams, undefined>(
        StepType.UserDefinedImport,
        props.mitoAPI,
        props.analysisData,
    )
    

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Custom Import"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody
                requiresEnterprise={{
                    featureName: "user_defined_import",
                    mitoAPI: props.mitoAPI
                }}
                userProfile={props.userProfile}
            >
                {params === undefined &&
                    <p>
                        
                    </p>
                }
                {params !== undefined &&
                    <Row justify='space-between' align='center' title='TODO'>
                        <Col>
                            <p className='text-header-3'>
                                Import Method
                            </p>
                        </Col>
                        <Col>
                            <Select
                                width='medium'
                                value={params.importer}
                                onChange={(newValue) => {                                    
                                    setParams(prevParams => {
                                        return {
                                            ...prevParams,
                                            importer: newValue
                                        }
                                    })
                                }}
                            >
                                {props.analysisData.userDefinedImporters.map(importer => {
                                    return (
                                        <DropdownItem 
                                            title={importer.name}
                                            subtext={importer.docstring}
                                        />
                                    )
                                })}
                            </Select>
                        </Col>
                    </Row>
                }
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => {
                        if (params !== undefined) {
                            edit(params);
                        }
                    }}
                    disabled={params === undefined}
                    disabledTooltip={NO_IMPORTERS_MESSAGE}
                >
                    Import Data
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UserDefinedImportTaskpane;