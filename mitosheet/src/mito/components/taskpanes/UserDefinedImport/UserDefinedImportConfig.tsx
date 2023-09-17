import React from "react";
import { getNoImportMessage, UserDefinedImportParams } from "./UserDefinedImportTaskpane"
import Input from "../../elements/Input";
import Toggle from "../../elements/Toggle";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { AnalysisData, UserDefinedImporter, UserDefinedImporterParamType } from "../../../types";


export const getEmptyDefaultParamsForImporter = (
    userDefinedImporter: UserDefinedImporter
): UserDefinedImportParams => {
    return {
        importer: userDefinedImporter.name,
        importer_params: Object.fromEntries(Object.keys(userDefinedImporter.parameters).map((paramName) => {
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
    } else if (paramType == 'bool') {
        return 'bool'
    } else {
        return undefined;
    }
}


const UserDefinedImportImportConfig = (props: {
    params: UserDefinedImportParams | undefined
    setParams: React.Dispatch<React.SetStateAction<UserDefinedImportParams | undefined>>
    error: string | undefined
    analysisData: AnalysisData
}): JSX.Element => {

    const params = props.params

    const userDefinedImporter = params !== undefined ? props.analysisData.userDefinedImporters.find(importer => importer.name === params.importer) : undefined;

    return (
        <>
            {params === undefined &&
                <p>
                    {getNoImportMessage()}
                </p>
            }
            {params !== undefined &&
                <>
                    <Row justify='space-between' align='center' title='Select the function with which to import data.'>
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
                                    props.setParams(prevParams => {
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
                        <LabelAndTooltip tooltip="Set parameters to the import method to configure how data is imported.">Import Parameters</LabelAndTooltip>
                    }
                    {
                        /**
                         * These params end up as Python code - and we want to be able to support whatever parameters
                         * users functions have. Moreover, we want to do the string -> correct type conversion in one
                         * place. 
                         * 
                         * Thus, we just do all our parsing from string -> correct param type on the backend. On the 
                         * frontend, we treat everything as a string (which leads to some strangeness with e.g. boolean
                         * or float inputs) -- but the error messages are still good, and we centralize all our parsing
                         * and casting in one place on the backend, which is nice.
                         */

                    }
                    {userDefinedImporter?.parameters !== undefined && Object.entries(userDefinedImporter.parameters).map(([paramName, paramType]) => {
                        const paramValue = params.importer_params[paramName];
                        
                        let inputElement = null;
                        if (paramType === 'str' || paramType === 'any' || paramType == 'int' || paramType == 'float') {
                            inputElement = (
                                <Input
                                    width="medium"
                                    value={paramValue}
                                    type={paramName.toLocaleLowerCase() =='password' ? 'password' : undefined}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        props.setParams(prevParams => {
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
                        } else if (paramType === 'bool') {
                            inputElement = (
                                <Toggle
                                    value={paramValue.toLowerCase().includes('true')}
                                    onChange={() => {
                                        const newValue = !paramValue.toLowerCase().includes('true');
                                        props.setParams(prevParams => {
                                            const newParams = window.structuredClone(prevParams);
                                            if (newParams === undefined) {
                                                return newParams
                                            }

                                            newParams.importer_params[paramName] = '' + newValue;
                                            return newParams;
                                        })
                                    }}
                                />
                            )
                        }

                        const typeSpan = getParamTypeDisplay(paramType) !== undefined 
                            ? <>: <span>{getParamTypeDisplay(paramType)}</span> </> 
                            : undefined

                        return (
                            <Row key={paramName} justify='space-between' align='center' title={`${paramName}`}>
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

                    {props.error !== undefined && 
                        <p className="text-color-error">{props.error}</p>
                    }
                </>
            }
        </>
    )
    
}

export default UserDefinedImportImportConfig;

