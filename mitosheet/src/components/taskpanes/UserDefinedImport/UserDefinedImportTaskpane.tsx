import React, { useState } from "react";
import MitoAPI from "../../../api/api";
import { AnalysisData, SheetData, StepType, UIState, UserDefinedImporter, UserDefinedImporterParamType, UserProfile } from "../../../types";
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
import Input from "../../elements/Input";


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
    importer_params: Record<string, string>
}
const getDefaultParams = (
    analysisData: AnalysisData,
): UserDefinedImportParams | undefined => {

    if (analysisData.userDefinedImporters.length === 0) {
        return undefined
    }

    // Otherwise, return the first importer
    const userDefinedImporter = analysisData.userDefinedImporters[0];
    return getEmptyDefaultParamsForImporter(userDefinedImporter)
}

const getEmptyDefaultParamsForImporter = (
    userDefinedImporter: UserDefinedImporter
): UserDefinedImportParams => {
    return {
        importer: userDefinedImporter.name,
        importer_params: Object.fromEntries(Object.entries(userDefinedImporter.parameters).map(([paramName, paramType]) => {
            return [paramName, '']})
        )
    }
}

const getParamTypeDisplay = (
    paramType: UserDefinedImporterParamType
): string | undefined => {
    if (paramType === 'str') {
        return 'string'
    } else if (paramType == 'float') {
        return 'float'
    } else if (paramType == 'int') {
        return 'int'
    } else {
        return undefined;
    }
}

const NO_IMPORTERS_MESSAGE = 'You have not defined any importers. To define importers, pass them to the mitosheet.sheet call with the `importers` parameter. An importer is just a function that returns a pandas dataframe.';

/* 
    This is the UserDefinedImport taskpane.
*/
const UserDefinedImportTaskpane = (props: UserDefinedImportTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultParams(props.analysisData));
    const [error, setError] = useState<string | undefined>(undefined);

    const {edit} = useSendEditOnClickNoParams<UserDefinedImportParams, undefined>(
        StepType.UserDefinedImport,
        props.mitoAPI,
        props.analysisData,
    )

    const userDefinedImporter = params !== undefined ? props.analysisData.userDefinedImporters.find(importer => importer.name === params.importer) : undefined;
    
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
                        Pass importers to the mitosheet.sheet call with the `importers` parameter. An importer is just a function that returns some number of pandas dataframes.
                    </p>
                }
                {params !== undefined &&
                    <>
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
                                            const userDefinedImporter = props.analysisData.userDefinedImporters.find(importer => importer.name === newValue);
                                            if (userDefinedImporter === undefined) {
                                                return prevParams
                                            }
                                            return getEmptyDefaultParamsForImporter(userDefinedImporter);
                                        })
                                    }}
                                >
                                    {props.analysisData.userDefinedImporters.map(importer => {
                                        return (
                                            <DropdownItem 
                                                key={importer.name}
                                                title={importer.name}
                                                subtext={importer.docstring}
                                            />
                                        )
                                    })}
                                </Select>
                            </Col>
                        </Row>
                        {userDefinedImporter?.parameters !== undefined && Object.keys(userDefinedImporter?.parameters).length > 0 && 
                            <Row justify='start' align='center' title='TODO'>
                                <Col>
                                    <p className='text-header-3'>
                                        Params
                                    </p>
                                </Col>
                            </Row>
                        }
                        {userDefinedImporter?.parameters !== undefined && Object.entries(userDefinedImporter.parameters).map(([paramName, paramType]) => {
                            const paramValue = params.importer_params[paramName];
                            
                            let inputElement = null;
                            if (paramType === 'str' || paramType === 'any' || paramType == 'int' || paramType == 'float') {
                                inputElement = (
                                    <Input
                                        width="medium"
                                        value={paramValue}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setParams(prevParams => {
                                                const newParams = window.structuredClone(prevParams);
                                                if (newParams === undefined) {
                                                    return newParams
                                                }

                                                newParams.importer_params[paramName] = newValue;
                                                return newParams;
                                            })
                                        }}
                                    />
                                )
                            } else {
                                // TODO: in the future, handle other types (e.g. booleans or Unions here)
                            }

                            const typeSpan = getParamTypeDisplay(paramType) !== undefined 
                                ? <>: <span>{getParamTypeDisplay(paramType)}</span> </> 
                                : undefined

                            return (
                                <Row justify='space-between' align='center' title='TODO'>
                                    <Col>
                                        <p>
                                            <span className='text-header-3'>{paramName}</span> {typeSpan}
                                        </p>
                                    </Col>
                                    <Col>
                                        {inputElement}
                                    </Col>
                                </Row>
                            )
                        })}

                        {error !== undefined && 
                            <p className="text-color-error">{error}</p>
                        }
                    </>
                }
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={async () => {
                        if (params !== undefined) {
                            const error = await edit(params);
                            setError(error)
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