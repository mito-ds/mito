import React from "react";
import MitoAPI from "../../jupyter/api";
import { AnalysisData, UIState } from "../../types"

import DefaultTaskpane from "../taskpanes/DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../taskpanes/DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../taskpanes/DefaultTaskpane/DefaultTaskpaneHeader";
import Row from "../layout/Row";
import Col from "../layout/Col";
import DropdownButton from "../elements/DropdownButton";
import DropdownItem from "../elements/DropdownItem";
import SelectAndXIconCard from "../elements/SelectAndXIconCard";
import DefaultTaskpaneFooter from "../taskpanes/DefaultTaskpane/DefaultTaskpaneFooter";
import TextButton from "../elements/TextButton";
import Tooltip from "../elements/Tooltip";
import { UpdatedImportObj } from "../taskpanes/UpdateImports/UpdateImportsTaskpane";
import { getImportName } from "../taskpanes/UpdateImports/ImportCard";
import { TaskpaneType } from "../taskpanes/taskpanes";
import RadioButtonBox from "../elements/RadioButtonBox";
import { useStateFromAPIAsync } from "../../hooks/useStateFromAPIAsync";


interface DataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    isUpdate: boolean;

    params: DataframeImportParams;
    setParams: React.Dispatch<React.SetStateAction<DataframeImportParams>>;
    edit: () => void;

    
    updateImportedData?: {
        updatedImportObjs: UpdatedImportObj[], 
        importIndex: number
    }
}

export interface DataframeImportParams {
    df_names: string[],
}

const getButtonMessage = (params: DataframeImportParams, isUpdate: boolean): string => {
    if (params.df_names.length === 0 && !isUpdate) {
        return `Select dataframes to import them`
    } else if (params.df_names.length === 0 && isUpdate) {
        return `Select a dataframe to import`
    } else if (isUpdate) {
        return `Update to ${params.df_names[0]}`
    }
    return `Import ${params.df_names.length} Selected dataframe${params.df_names.length === 1 ? '' : 's'}`;
}


/* 
    This is the DataframeImport taskpane, allows users to import a specific dataframe
*/
const DataframeImportTaskpane = (props: DataframeImportTaskpaneProps): JSX.Element => {

    const [dfNamesInNotebook] = useStateFromAPIAsync(
        [],
        props.mitoAPI.getDefinedDfNames,
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
        />
    ) 

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
                header={props.updateImportedData === undefined ? 'Import Dataframes' : 'Replace ' + getImportName(props.updateImportedData?.updatedImportObjs[props.updateImportedData?.importIndex])}
                setUIState={props.setUIState} 
                backCallback={props.updateImportedData === undefined ? undefined : () => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.UPDATEIMPORTS, updatedImportObjs: props.updateImportedData?.updatedImportObjs}
                        }
                    })
                }}          
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
                {props.updateImportedData === undefined && dataframeCards}
                {props.updateImportedData !== undefined && radioButtonBox}
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
                    {getButtonMessage(props.params, props.updateImportedData !== undefined)}
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default DataframeImportTaskpane;