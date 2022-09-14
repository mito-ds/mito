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


interface DataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}





/* 
    This is the DataframeImport taskpane.
*/
const DataframeImportTaskpane = (props: DataframeImportTaskpaneProps): JSX.Element => {

    const [definedDfNames, setDefinedDfNames] = useState<string[]>([]);

    const {params, setParams, edit} = useSendEditOnClick<{df_names: string[]}, {df_names: string[]}>(
        {df_names: []}, StepType.DataframeImport, props.mitoAPI, props.analysisData,
    )


    useEffect(() => {
        const loadDefinedDfNames = async () => {
            const _definedDfNames = await props.mitoAPI.getDefinedDfNames();
            if (_definedDfNames !== undefined) {
                setDefinedDfNames(_definedDfNames.df_names)
            }
        }
        void loadDefinedDfNames();
    }, [])

    const dfNameMap: Record<string, string> = {};
    definedDfNames.forEach(dfName => {dfNameMap[dfName] = dfName});

    const dataframeCards: JSX.Element[] = (params?.df_names || []).map((dfName, arrIndex) => {
        return (
            <SelectAndXIconCard 
                titleMap={dfNameMap}
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
                selectableValues={definedDfNames}
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
                        <p className='text-header-3'>
                            Dataframes to Import
                        </p>
                    </Col>
                    <Col>
                        <DropdownButton
                            text='+ Add'
                            width='small'
                            searchable
                        >   
                            {/** We allow users to select all dataframes in the sheet, as some users want this */}
                            {[
                                <DropdownItem
                                    key={-1}
                                    title="Add all dataframes"
                                    onClick={() => {
                                        setParams(prevParams => {
                                            const newDfNames = [...definedDfNames];
                    
                                            return {
                                                ...prevParams,
                                                df_names: newDfNames
                                            }
                                        })
                                    }}
                                />
                            ].concat(definedDfNames.map((dfName, index) => {
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
                        <p className="text-subtext-1">Add a dataframe to import it as a tab in the mitosheet.</p>
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