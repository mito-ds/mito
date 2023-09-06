import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, UIState, UserProfile } from "../../../types";

import { useDebouncedEffect } from "../../../hooks/useDebouncedEffect";
import Input from "../../elements/Input";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import Toggle from "../../elements/Toggle";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import CodeOptionsParameters from "./CodeOptionsParameters";


interface CodeOptionsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
}



/* 
    This is the CodeOptions taskpane, allows you to configure how the code is generated
*/
const CodeOptionsTaskpane = (props: CodeOptionsTaskpaneProps): JSX.Element => {

    const [codeOptions, setCodeOptions] = useState(() => props.analysisData.codeOptions);
    const [firstRender, setFirstRender] = useState(true);

    useDebouncedEffect(() => {
        if (firstRender) {
            setFirstRender(false);
            return;
        }

        void props.mitoAPI.updateCodeOptions(codeOptions);
    }, [codeOptions], 500);

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Generated Code Options"
                setUIState={props.setUIState} 
            />
            <DefaultTaskpaneBody
                requiresEnterprise={{
                    featureName: "code_options",
                    mitoAPI: props.mitoAPI
                }}
                userProfile={props.userProfile}
            >
                
                <Row justify='space-between' align='center'>
                    <Col>
                        <LabelAndTooltip tooltip="A Python function is a reusable block of code that performs a specific task. It takes input, processes it, and returns output, making your code more organized and able to be easily rerun on new datasets.">
                            Generate Function
                        </LabelAndTooltip>
                    </Col>
                    <Col>
                        <Toggle 
                            value={props.analysisData.codeOptions.as_function} 
                            onChange={function (): void {
                                const newCodeOptions = {...codeOptions};
                                newCodeOptions.as_function = !newCodeOptions.as_function;
                                setCodeOptions(newCodeOptions);
                            }}
                        />
                    </Col>
                </Row>
                <Row justify='space-between' align='center'>
                    <Col span={14}>
                        <LabelAndTooltip tooltip="Give your function a short, descriptive name descring what it does.">
                            Function Name
                        </LabelAndTooltip>
                    </Col>
                    <Col>
                        <Input
                            disabled={!codeOptions.as_function}
                            value={codeOptions.function_name}
                            onChange={(e): void => {
                                const newCodeOptions = {...codeOptions};
                                newCodeOptions.function_name = e.target.value;
                                setCodeOptions(newCodeOptions);
                            }}
                        ></Input>
                    </Col>
                </Row>
                <Row justify='space-between' align='center'>
                    <Col>
                        <LabelAndTooltip tooltip="You can optionally configure the code to not call your generated function. Toggling this to false in a Jupyter notebook may break later cells.">
                            Call Function
                        </LabelAndTooltip>
                    </Col>
                    <Col>
                        <Toggle 
                            value={props.analysisData.codeOptions.call_function} 
                            disabled={!codeOptions.as_function}
                            onChange={function (): void {
                                const newCodeOptions = {...codeOptions};
                                newCodeOptions.call_function = !newCodeOptions.call_function;
                                setCodeOptions(newCodeOptions);
                            }}
                        />
                    </Col>
                </Row>
                <CodeOptionsParameters
                    mitoAPI={props.mitoAPI}
                    codeOptions={codeOptions}
                    setCodeOptions={setCodeOptions}
                />
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default CodeOptionsTaskpane;