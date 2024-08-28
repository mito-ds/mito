import React from "react";
import { SheetData, UserDefinedFunctionParamNameToType } from "../../../types";
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import { getDisplayNameOfPythonVariable, getParamTypeDisplay } from '../../../utils/userDefinedFunctionUtils';
import DataframeSelect from "../../elements/DataframeSelect";
import DropdownItem from '../../elements/DropdownItem';
import Input from "../../elements/Input";
import Select from '../../elements/Select';
import Toggle from "../../elements/Toggle";
import Tooltip from "../../elements/Tooltip";
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import TextButton from "../../elements/TextButton";


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
const UserDefinedFunctionParamConfigSection = (props: {
    // TODO: Give these better names, omg
    paramNameToType: UserDefinedFunctionParamNameToType | undefined
    params: Record<string, string> | undefined;
    setParams: (newParams: Record<string, string>) => void;
    sheetDataArray: SheetData[];
}): JSX.Element => {

    // Create a UseEffect that is triggered when the paramNameToType is updated 
    // so that we can rerender the screen with new input fields

    const {paramNameToType, params} = props;
    if (paramNameToType === undefined || params === undefined) {
        return <></>
    }
    const paramNameAndTypeTuples = Object.entries(paramNameToType);

    // We generate a single row for each parameter, storing the previous sheet index
    // so that we can use it for the column header dropdowns if they appear
    const paramRowElements = []
    let previousSheetIndex = -1;

    for (let paramIndex = 0; paramIndex < paramNameAndTypeTuples.length; paramIndex++) {
        const [paramName, paramType] = paramNameAndTypeTuples[paramIndex];
        const paramValue = params[paramName];
        const paramDisplayName = getDisplayNameOfPythonVariable(paramName)
        
        let inputElement = null;
        if (paramType === 'DataFrame') {
            const sheetIndex = paramValue !== '' ? props.sheetDataArray.findIndex(sheetData => sheetData.dfName === paramValue) : 0;
            previousSheetIndex = sheetIndex;
            paramRowElements.push(
                <DataframeSelect
                    sheetDataArray={props.sheetDataArray}
                    sheetIndex={sheetIndex}
                    title={paramDisplayName}
                    span={8}
                    onChange={(newSheetIndex) => {
                        const newSheetData = props.sheetDataArray[newSheetIndex];
                        const newValue = newSheetData.dfName;
                        const newParams = window.structuredClone(params);
                        newParams[paramName] = newValue;

                        // Find all later parameters that are ColumnHeader typed, before the next DataFrame typed parameter
                        // And set them to the first column in this new dataframe
                        for (let laterParamIndex = paramIndex + 1; laterParamIndex < paramNameAndTypeTuples.length; laterParamIndex++) {
                            const [laterParamName, laterParamType] = paramNameAndTypeTuples[laterParamIndex];
                            if (laterParamType === 'ColumnHeader') {
                                newParams[laterParamName] = Object.keys(newSheetData.columnIDsMap)[0] || '';
                            } else if (laterParamType === 'DataFrame') {
                                break;
                            }
                        }

                        props.setParams(newParams);
                    }}
                />
            )
        } else {
            if (paramType === 'ColumnHeader') {
                const sheetData = props.sheetDataArray[previousSheetIndex];
                if (sheetData === undefined) {
                    // If there is no preceding dataframe, we can't allow users to set the column header
                    inputElement = <p className="text-color-error">
                        The parameter {paramName} of type Column Header has no preceding dataframe to reference, and as such cannot be set.
                    </p>
                } else {
                    inputElement = (
                        <Select
                            value={paramValue}
                            onChange={(newID: string) => {
                                const newParams = window.structuredClone(params);
                                newParams[paramName] = newID;
                                props.setParams(newParams);
                            }}
                            searchable
                        >
                            {Object.entries(sheetData?.columnIDsMap || {}).map(([columnID, columnHeader]) => {
                                return (
                                    <DropdownItem
                                        key={columnID}
                                        id={columnID}
                                        title={getDisplayColumnHeader(columnHeader)}
                                    />
                                )
                            })}
                        </Select>
                    )
                }
            } else if (paramType === 'str' || paramType === 'any' || paramType == 'int' || paramType == 'float') {
                inputElement = (
                    <Input
                        value={paramValue}
                        type={paramName.toLocaleLowerCase() =='password' ? 'password' : undefined}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            const newParams = window.structuredClone(params);
                            newParams[paramName] = newValue;
                            props.setParams(newParams);
                        }}
                        placeholder={paramType === 'str' ? 'Add string' : paramType === 'int' ? 'Add an int' : paramType === 'float' ? 'Add a float' : undefined}
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
            } else if (paramType === 'List[int]') {
                const paramValues = paramValue.split(',').map(value => value.trim());
                if (paramValues.length === 0) {
                    paramValues.push('')
                }
                inputElement = (
                    <React.Fragment>
                        {paramValues.map((value, index) => {
                            return (
                                <Input
                                    key={index}
                                    value={value}
                                    onChange={(e) => {
                                        const newValues = [...paramValues];
                                        newValues[index] = e.target.value;
                                        const newParams = window.structuredClone(params);
                                        newParams[paramName] = newValues.join(',');
                                        props.setParams(newParams);
                                    }}
                                    style={{marginBottom: '8px'}}
                                    placeholder="Add int to list"
                                />
                            )
                        })}
                        <TextButton
                            onClick={() => {
                                const newValues = [...paramValues, ''];
                                const newParams = window.structuredClone(params);
                                newParams[paramName] = newValues.join(',');
                                props.setParams(newParams);
                            }}
                            variant="dark"
                        >
                            Add another int
                        </TextButton>
                    </React.Fragment>
                )
            }

            const paramTypeDisplay = getParamTypeDisplay(paramType) !== undefined 
                ? ': ' + getParamTypeDisplay(paramType)
                : undefined

            const tooltip = `${paramName}${paramTypeDisplay}`;

            paramRowElements.push(
                <Row key={paramName} justify='space-between' title={tooltip}>
                    <Col span={14}>
                        <Row justify="start" align="center" suppressTopBottomMargin>
                            <Col>
                                <p className="text-overflow-hide">
                                    <span className='text-header-3'>{paramDisplayName}</span>
                                </p>
                            </Col>
                            <Col>
                                <Tooltip title={tooltip}/>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={8}>
                        {inputElement}
                    </Col>
                </Row>
            )
        } 
    }

    return (
        <>
            {...paramRowElements}
            {paramRowElements.length === 0 ? <p className="text-body-1">This function has no parameters to configure.</p> : <></>}
        </>
    )
}

export default UserDefinedFunctionParamConfigSection;

