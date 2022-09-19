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


interface DataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}



/* 
    This is the DataframeImport taskpane, allows users to import a specific dataframe
*/
const DataframeImportTaskpane = (props: DataframeImportTaskpaneProps): JSX.Element => {

    const [dfNamesInNotebook, setDfNamesInNotebook] = useState<string[]>([]);

    const {params, setParams, edit} = useSendEditOnClick<{df_names: string[]}, {df_names: string[]}>(
        {df_names: []}, StepType.DataframeImport, props.mitoAPI, props.analysisData, {allowSameParamsToReapplyTwice: true}
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

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Import Dataframes"
                setUIState={props.setUIState}           
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
                            {/** We allow users to select all dataframes in the notebook, as some users want this */}
                            {[
                                <DropdownItem
                                    key={-1}
                                    title="Add all dataframes"
                                    onClick={() => {
                                        setParams(prevParams => {
                                            const newDfNames = [...dfNamesInNotebook];
                    
                                            return {
                                                ...prevParams,
                                                df_names: newDfNames
                                            }
                                        })
                                    }}
                                />
                            ].concat(dfNamesInNotebook.map((dfName, index) => {
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
                            }))}
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
                        edit();
                    }}
                    disabled={(params?.df_names.length || 0) === 0}
                >
                    Import Dataframes
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default DataframeImportTaskpane;