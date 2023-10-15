import React from "react";
import { MitoAPI } from "../../../api/api";
import { CodeOptions, ParamName, ParamSubType, ParamType, ParamValue, ParameterizableParams } from "../../../types";

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

const getParamDisplayString = (paramValue: string, paramType: ParamType): string => {
    if (paramType === 'file_name') {
        return getFileNameFromParamValue(paramValue);
    } else {
        return paramValue;
    }
}

const getParamDescriptionString = (paramSubtype: ParamSubType): string => {
    if (paramSubtype === 'import_dataframe') {
        return 'Dataframe'
    } else if (paramSubtype === 'file_name_import_csv') {
        return 'CSV Import File Path'
    } else if (paramSubtype === 'file_name_import_excel') {
        return 'Excel Import File Path'
    } else if (paramSubtype === 'file_name_export_csv') {
        return 'CSV Export File Path'
    } else if (paramSubtype === 'file_name_export_excel') {
        return 'Excel Export File Path'
    } else if (paramSubtype === 'all') {
        return 'All Possible Parameters'
    } else {
        return paramSubtype;
    }


}

const getFileNameFromParamValue = (paramValue: string): string => {
    // eslint-disable-next-line no-useless-escape
    let fileName = paramValue.replace(/^.*[\\\/]/, ''); // Get the final path
    fileName = fileName.substring(0, fileName.length - 1); // Remove the final quote
    if (fileName.startsWith('r"') || fileName.startsWith("r'")) {
        fileName = fileName.substring(2); // Remove the r"
    } else if (fileName.startsWith("'") || fileName.startsWith('"')) {
        fileName = fileName.substring(1); // Remove the first quote
    }
    return fileName;
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

function isFunctionParamsDict(functionParams: Record<ParamName, ParamValue> | ParamSubType | ParamSubType[]): functionParams is Record<ParamName, ParamValue> {
    return (typeof functionParams === 'object' && !Array.isArray(functionParams));
}

/* 
    This is the CodeOptions taskpane, allows you to configure how the code is generated
*/
const CodeOptionsParameters = (props: CodeOptionsParametersProps): JSX.Element => {

    const [parameterizableParams] = useStateFromAPIAsync<ParameterizableParams, undefined>(
        [],
        async () => {
            const response = await props.mitoAPI.getParameterizableParams();
            return 'error' in response ? undefined : response.result;
        },
        undefined,
        []
    );

    const unparametizedParams = parameterizableParams.filter(([paramName,]) => {
        return !Object.values(props.codeOptions.function_params).includes(paramName);
    });

    const functionParams = props.codeOptions.function_params;

    const disabled = parameterizableParams.length === 0 
        || props.codeOptions.as_function === false
        || !isFunctionParamsDict(functionParams);


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
                        disabled={disabled}
                        title={!props.codeOptions.as_function ? 'Toggle Generate Function before adding parameters.' : (parameterizableParams.length === 0 ? 'There are no available options to parameterize. Import data first.' : undefined)}
                    >   
                        {unparametizedParams.map(([paramValue, paramType, paramSubtype], index) => {
                            const paramDescription = getParamDescriptionString(paramSubtype);

                            return (
                                <DropdownItem
                                    key={index}
                                    title={getParamDisplayString(paramValue, paramType)}
                                    subtext={paramDescription}
                                    onClick={() => {                                        
                                        props.setCodeOptions((prevCodeOptions) => {
                                            const newCodeOptions = {...prevCodeOptions};
                                            if (!isFunctionParamsDict(newCodeOptions.function_params)) {
                                                return prevCodeOptions;
                                            }

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
            {Object.entries(props.codeOptions.function_params).length > 0 &&
                <Row justify='space-between' align='center'>
                    <Col span={8} offsetRight={2}>
                        <p>
                            Value
                        </p>
                    </Col>
                    <Col span={10} offsetRight={2}>
                        <p>
                            Param Name
                        </p>
                    </Col>
                    <Col span={2}>
                    </Col>
                </Row>
            }
            {!isFunctionParamsDict(functionParams) && 
                <p>
                    Function params have been set by the mitosheet creator and cannot be edited.
                </p>
            }
            {isFunctionParamsDict(functionParams) && Object.entries(functionParams).sort((a, b) => a[1].localeCompare(b[1])).map(([paramName, paramValue], index) => {
                return (
                    <Row key={index} justify='space-between' align='center'>
                        <Col span={8} offsetRight={2}>
                            <p title={paramValue}>
                                {getParamDisplayString(paramValue, paramValue.startsWith('r"') || paramValue.startsWith("r'") || paramValue.startsWith("'") ? 'file_name' : 'df_name')}
                            </p>
                        </Col>
                        <Col span={10} offsetRight={2}>
                            <Input
                                width="block"
                                value={paramName}
                                onChange={(e) => {
                                    const newParamName = e.target.value;
                                    let finalNewParamName = newParamName;

                                    const newCodeOptions = {...props.codeOptions};

                                    if (!isFunctionParamsDict(newCodeOptions.function_params)) {
                                        return;
                                    }

                                    if (Object.keys(newCodeOptions.function_params).includes(newParamName)) {
                                        let i = 1;
                                        finalNewParamName = newParamName + i;
                                        while (Object.keys(newCodeOptions.function_params).includes(newParamName + i)) {
                                            i++;
                                            finalNewParamName = newParamName + i;
                                        }
                                    } else {
                                        finalNewParamName = newParamName;
                                    }

                                    newCodeOptions.function_params[finalNewParamName] = newCodeOptions.function_params[paramName];
                                    delete newCodeOptions.function_params[paramName];
                                    props.setCodeOptions(newCodeOptions);

                                }}
                            />
                        </Col>
                        <Col span={2}>
                            <XIcon
                                onClick={() => {
                                    const newCodeOptions = {...props.codeOptions};
                                    if (!isFunctionParamsDict(newCodeOptions.function_params)) {
                                        return;
                                    }

                                    delete newCodeOptions.function_params[paramName];
                                    props.setCodeOptions(newCodeOptions);
                                }}
                            />
                        </Col>
                    </Row>
                )}
            )}
        </>
    )
}

export default CodeOptionsParameters;