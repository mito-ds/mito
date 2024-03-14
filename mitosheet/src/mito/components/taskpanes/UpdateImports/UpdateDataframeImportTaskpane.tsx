import React from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, UIState } from "../../../types";

import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import RadioButtonBox from "../../elements/RadioButtonBox";
import TextButton from "../../elements/TextButton";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import Spacer from "../../layout/Spacer";


interface UpdateDataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    isUpdate: boolean;

    params: DataframeImportParams | undefined;
    setParams: (updater: (prevParams: DataframeImportParams) => DataframeImportParams) => void;
    edit: () => void;

    backCallback?: () => void;
    notCloseable?: boolean;
}

export interface DataframeImportParams {
    df_names: string[],
}

const getButtonMessage = (params: DataframeImportParams): string => {
    if (params.df_names.length === 0) {
        return `Select dataframe to update`
    }
    return `Update to ${params.df_names[0]}`;
}


/* 
    Allows users to change an imported dataframe to an new dataframe.

    This is distinct from the DataframeImport taskpane as it fundamentally
    displays a new UI, in a major way!
*/
const UpdateDataframeImportScreen = (props: UpdateDataframeImportTaskpaneProps): JSX.Element => {

    const [dfNamesInNotebook, loading] = useStateFromAPIAsync(
        [],
        async () => {
            const response = await props.mitoAPI.getDefinedDfNames()
            return 'error' in response ? undefined : response.result;
        },
        undefined,
        []
    )

    const radioButtonBox: JSX.Element = (
        <RadioButtonBox 
            values={dfNamesInNotebook} 
            selectedValue={props.params?.df_names[0]} 
            onChange={newDfName => props.setParams(prevParams => {
                return {
                    ...prevParams,
                    df_names: [newDfName]
                }
            })}
            loading={loading}
        />
    ) 

    if (props.params === undefined) {
        return (
            <div className='text-body-1'>
                There has been an error loading dataframes to import. Please try again, or <a className='text-body-1-link' href='https://join.slack.com/t/trymito/shared_invite/zt-1h6t163v7-xLPudO7pjQNKccXz7h7GSg' target='_blank' rel="noreferrer">contact support</a>.
            </div>
        )
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader 
                header={props.isUpdate ? 'Import Dataframes' : 'Update Import'}
                setUIState={props.setUIState} 
                backCallback={props.backCallback}
                notCloseable={props.notCloseable}    
            />
            <DefaultTaskpaneBody>
                <Row justify='start' align='center'>
                    <Col>
                        <LabelAndTooltip tooltip="Dataframes that have been created elsewhere in this notebook can be imported through this taskpane.">
                            Dataframes to Import
                        </LabelAndTooltip>
                    </Col>
                </Row>
                {radioButtonBox}
                <Spacer px={10}/>
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => {
                        props.edit();
                    }}
                    disabled={(props.params?.df_names.length || 0) === 0}
                >
                    {getButtonMessage(props.params)}
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateDataframeImportScreen;