import React, { useEffect, useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types"
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import Row from "../../layout/Row";
import Col from "../../layout/Col";
import DropdownButton from "../../elements/DropdownButton";
import DropdownItem from "../../elements/DropdownItem";
import SelectAndXIconCard from "../../elements/SelectAndXIconCard";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import TextButton from "../../elements/TextButton";
import Tooltip from "../../elements/Tooltip";
import { UpdatedImportObj } from "../UpdateImports/UpdateImportsTaskpane";
import { getImportName } from "../UpdateImports/ImportCard";
import { TaskpaneType } from "../taskpanes";
import { updateImportedDataWithDataframe } from "../UpdateImports/UpdateImportsUtils";
import RadioButtonBox from "../../elements/RadioButtonBox";


interface DataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
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

    const [dfNamesInNotebook, setDfNamesInNotebook] = useState<string[]>([]);

    const {params, setParams, edit} = useSendEditOnClick<{df_names: string[]}, {df_names: string[]}>(
        {df_names: []}, 
        StepType.DataframeImport, 
        props.mitoAPI, 
        props.analysisData, 
        {allowSameParamsToReapplyTwice: true}, 
        // If we're updating already imported data, then pass the override edit function
        props.updateImportedData === undefined ? undefined : (newImportedData) => updateImportedDataWithDataframe(props.updateImportedData, newImportedData, props.setUIState)
    )

    useEffect(() => {
        const loadDefinedDfNames = async () => {
            const _definedDfNames = await props.mitoAPI.getDefinedDfNames();
            if (_definedDfNames !== undefined) {
                setDfNamesInNotebook(_definedDfNames.df_names)
            }
        }
        void loadDefinedDfNames();
    }, []);

    const dataframeCards: JSX.Element[] = (params?.df_names || []).map((dfName, arrIndex) => {
        return (
            <SelectAndXIconCard 
                key={arrIndex}
                value={dfName}
                onChange={(newDfName) => {
                    setParams(prevParams => {
                        const newDfNames = [...prevParams.df_names];
                        newDfNames[arrIndex] = newDfName;

                        return {
                            ...prevParams,
                            df_names: newDfNames
                        }
                    })
                }}
                onDelete={() => {
                    setParams(prevParams => {
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
            selectedValue={params?.df_names[0]} 
            onChange={newDfName => setParams(prevParams => {
                return {
                    ...prevParams,
                    df_names: [newDfName]
                }
            })}
        />
    ) 

    if (params === undefined) {
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
                                            setParams(prevParams => {
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
                        console.log("here")
                        edit();
                    }}
                    disabled={(params?.df_names.length || 0) === 0}
                >
                    {getButtonMessage(params, props.updateImportedData !== undefined)}
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default DataframeImportTaskpane;