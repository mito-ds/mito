import React from "react";
import { UserDefinedFunctionParamNameToType, UserDefinedFunction, SheetData } from "../../../types";
import Input from "../../elements/Input";
import Toggle from "../../elements/Toggle";
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { UserDefinedImportParams } from "./UserDefinedImportTaskpane";
import DataframeSelect from "../../elements/DataframeSelect";
import {getParamTypeDisplay, getDisplayNameOfPythonVariable, getInitialEmptyParameters} from '../../../utils/userDefinedFunctionUtils';


export const getEmptyDefaultParamsForImporter = (
    sheetDataArray: SheetData[],
    selectedSheetIndex: number,
    userDefinedImporter: UserDefinedFunction
): UserDefinedImportParams => {
    return {
        importer: userDefinedImporter.name,
        importer_params: getInitialEmptyParameters(sheetDataArray, selectedSheetIndex, userDefinedImporter.parameters)
    }
}


const UserDefinedFunctionParamConfigSection = (props: {
    // TODO: Give these better names, omg
    paramNameToType: UserDefinedFunctionParamNameToType | undefined
    params: Record<string, string> | undefined;
    setParams: (newParams: Record<string, string>) => void;
    sheetDataArray: SheetData[];
}): JSX.Element => {

    const {paramNameToType, params} = props;

    return (
        <>
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
            {params !== undefined && paramNameToType !== undefined && Object.entries(paramNameToType).map(([paramName, paramType]) => {
                const paramValue = params[paramName];
                const paramDisplayName = getDisplayNameOfPythonVariable(paramName)
                
                let inputElement = null;
                if (paramName == 'df') {
                    const sheetIndex = paramValue !== '' ? props.sheetDataArray.findIndex(sheetData => sheetData.dfName === paramValue) : 0;

                    return (
                        <DataframeSelect
                            sheetDataArray={props.sheetDataArray}
                            sheetIndex={sheetIndex}
                            title="Dataframe"
                            onChange={(newSheetIndex) => {
                                const newValue = props.sheetDataArray[newSheetIndex].dfName;
                                const newParams = window.structuredClone(params);
                                newParams[paramName] = newValue;
                                props.setParams(newParams);
                            }}
                        />
                    )

                } else if (paramType === 'str' || paramType === 'any' || paramType == 'int' || paramType == 'float') {
                    inputElement = (
                        <Input
                            width="medium"
                            value={paramValue}
                            type={paramName.toLocaleLowerCase() =='password' ? 'password' : undefined}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                const newParams = window.structuredClone(params);
                                newParams[paramName] = newValue;
                                props.setParams(newParams);
                            }}
                        />
                    )
                } else if (paramType === 'bool') {
                    inputElement = (
                        <Toggle
                            value={paramValue.toLowerCase().includes('true')}
                            onChange={() => {
                                const newValue = !paramValue.toLowerCase().includes('true');
                                const newParams = window.structuredClone(params);
                                newParams[paramName] = '' + newValue;
                                props.setParams(newParams);
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
                                <span className='text-header-3'>{paramDisplayName}</span> {typeSpan}
                            </p>
                        </Col>
                        <Col>
                            {inputElement}
                        </Col>
                    </Row>
                )
            })}
        </>
    )
    
}

export default UserDefinedFunctionParamConfigSection;

