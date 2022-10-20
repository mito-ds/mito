import React from "react";
import MitoAPI from "../../jupyter/api";
import { AnalysisData, UIState } from "../../types";

import { useStateFromAPIAsync } from "../../hooks/useStateFromAPIAsync";
import DropdownButton from "../elements/DropdownButton";
import DropdownItem from "../elements/DropdownItem";
import SelectAndXIconCard from "../elements/SelectAndXIconCard";
import TextButton from "../elements/TextButton";
import Tooltip from "../elements/Tooltip";
import Col from "../layout/Col";
import Row from "../layout/Row";
import DefaultTaskpane from "../taskpanes/DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../taskpanes/DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../taskpanes/DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../taskpanes/DefaultTaskpane/DefaultTaskpaneHeader";


interface DataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    isUpdate: boolean;

    params: DataframeImportParams | undefined;
    setParams: (updater: (prevParams: DataframeImportParams) => DataframeImportParams) => void;
    edit: () => void;

    backCallback?: () => void;
}

export interface DataframeImportParams {
    df_names: string[],
}

const getButtonMessage = (params: DataframeImportParams): string => {
    if (params.df_names.length === 0) {
        return `Select dataframes to import them`
    }
    return `Import ${params.df_names.length} Selected dataframe${params.df_names.length === 1 ? '' : 's'}`;
}


/* 
    Allows users to import a specific dataframe
*/
const DataframeImportScreen = (props: DataframeImportTaskpaneProps): JSX.Element => {

    const [dfNamesInNotebook] = useStateFromAPIAsync(
        [],
        () => {return props.mitoAPI.getDefinedDfNames()},
        undefined,
        []
    )


    const dataframeCards: JSX.Element[] = (props.params?.df_names || []).map((dfName, arrIndex) => {
        return (
            <SelectAndXIconCard 
                key={arrIndex}
                value={dfName}
                onChange={(newDfName) => {
                    props.setParams(prevParams => {
                        const newDfNames = [...prevParams.df_names];
                        newDfNames[arrIndex] = newDfName;

                        return {
                            ...prevParams,
                            df_names: newDfNames
                        }
                    })
                }}
                onDelete={() => {
                    props.setParams(prevParams => {
                        const newDfNames = [...prevParams.df_names];
                        newDfNames.splice(arrIndex, 1);

                        return {
                            ...prevParams,
                            df_names: newDfNames
                        }
                    })
                }}
                selectableValues={dfNamesInNotebook}
            />
        )
    })

    if (props.params === undefined) {
        return (
            <div className='text-body-1'>
                There has been an error loading dataframes to import. Please try again, or contact support.
            </div>
        )
    }

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header={props.isUpdate ? 'Import Dataframes' : 'Update Import'}
                setUIState={props.setUIState} 
                backCallback={props.backCallback}    
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center'>
                    <Col>
                        <Row justify="start" align="center">
                            <Col>
                                <p className='text-header-3'>
                                    Dataframes to Import
                                </p>
                            </Col>
                            <Col>
                                <Tooltip title={"Dataframes that have been created elsewhere in this notebook can be imported through this taskpane."} />
                            </Col>
                        </Row>
                    </Col>
                    <Col>
                        <DropdownButton
                            text='+ Add'
                            width='small'
                            searchable
                        >   
                            {dfNamesInNotebook.map((dfName, index) => {
                                return (
                                    <DropdownItem
                                        key={index}
                                        title={dfName}
                                        onClick={() => {
                                            props.setParams(prevParams => {
                                                const newDfNames = [...prevParams.df_names];
                                                newDfNames.push(dfName);
                        
                                                return {
                                                    ...prevParams,
                                                    df_names: newDfNames
                                                }
                                            })
                                        }}
                                    />
                                )
                            })}
                        </DropdownButton>
                    </Col>
                </Row>
                {dataframeCards}
                {dataframeCards.length === 0 &&
                    <Row>
                        <p className="text-subtext-1">Import an existing dataframe as a new sheet tab in Mito</p>
                    </Row>
                
                }
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

export default DataframeImportScreen;