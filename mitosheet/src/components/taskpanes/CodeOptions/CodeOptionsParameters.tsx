import React from "react";
import MitoAPI from "../../../jupyter/api";
import { CodeOptions, ParamType, ParameterizableParams } from "../../../types";

import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import DropdownButton from "../../elements/DropdownButton";
import DropdownItem from "../../elements/DropdownItem";
import Input from "../../elements/Input";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import XIcon from "../../icons/XIcon";


interface CodeOptionsParametersProps {
    mitoAPI: MitoAPI;
    codeOptions: CodeOptions,
    setCodeOptions: React.Dispatch<React.SetStateAction<CodeOptions>>;
}

const getFileNameFromParamValue = (paramValue: string): string => {
    const fileName = paramValue.replace(/^.*[\\\/]/, ''); // Get the final path
    return fileName.substring(0, fileName.length - 1); // Remove the final quote
}

const getDefaultParamName = (paramValue: string, paramType: ParamType): string => {
    if (paramType === 'file_name') {
        const fileName = getFileNameFromParamValue(paramValue);
        const noExt = fileName.substring(0, fileName.indexOf('.')); // Remove the file extension
        const withUnderscores = noExt.replace(/[^a-zA-Z0-9]/g, '_'); // Replace all non-alphanumeric characters with underscores
        return withUnderscores + '_path';
    } else {
        return paramValue;
    }
}


/* 
    This is the CodeOptions taskpane, allows you to configure how the code is generated
*/
const CodeOptionsParameters = (props: CodeOptionsParametersProps): JSX.Element => {

    const [parameterizableParams] = useStateFromAPIAsync<ParameterizableParams, undefined>(
        [],
        () => {return props.mitoAPI.getParameterizableParams()},
        undefined,
        []
    );

    const unparametizedParams = parameterizableParams.filter(([paramName, paramType]) => {
        return !Object.values(props.codeOptions.function_params).includes(paramName);
    });

    return (
        <>
            <Row justify='space-between' align='center'>
                <Col>
                    <LabelAndTooltip tooltip="Parameterize your analysis, making it easier to pass in different values.">
                        Function Parameters
                    </LabelAndTooltip>
                </Col>
                <Col>
                    <DropdownButton
                        text='+ Add'
                        width='small'
                        searchable
                        disabled={parameterizableParams.length === 0 || props.codeOptions.as_function === false}
                    >   
                        {unparametizedParams.map(([paramValue, paramType], index) => {
                            return (
                                <DropdownItem
                                    key={index}
                                    title={getFileNameFromParamValue(paramValue)}
                                    subtext={paramType}
                                    onClick={() => {                                        
                                        props.setCodeOptions((prevCodeOptions) => {
                                            const newCodeOptions = {...prevCodeOptions};
                                            const paramName = getDefaultParamName(paramValue, paramType);
                                            newCodeOptions.function_params[paramName] = paramValue;
                                            return newCodeOptions;
                                        })
                                        
                                    }}
                                />
                            )
                        })}
                    </DropdownButton>
                </Col>
            </Row>
            {Object.entries(props.codeOptions.function_params).map(([paramName, paramValue], index) => {
                return (
                    <Row key={index} justify='space-between' align='center'>
                        <Col span={8} offsetRight={2}>
                            <p title={paramValue}>
                                {getFileNameFromParamValue(paramValue)}
                            </p>
                        </Col>
                        <Col span={10} offsetRight={2}>
                            <Input
                                width="block"
                                value={paramName}
                                onChange={(event) => {
                                    const newCodeOptions = {...props.codeOptions};
                                    newCodeOptions.function_params[event.target.value] = newCodeOptions.function_params[paramName];
                                    delete newCodeOptions.function_params[paramName];
                                    props.setCodeOptions(newCodeOptions);
                                }}
                            />
                        </Col>
                        <Col span={2}>
                            <XIcon
                                onClick={() => {
                                    const newCodeOptions = {...props.codeOptions};
                                    delete newCodeOptions.function_params[paramName];
                                    props.setCodeOptions(newCodeOptions);
                                }}
                            />
                        </Col>
                    </Row>
                )
            })}
        </>
    )
}

export default CodeOptionsParameters;