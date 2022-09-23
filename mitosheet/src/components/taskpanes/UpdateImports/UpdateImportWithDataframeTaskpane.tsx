import React, { useEffect, useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types"
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import Row from "../../layout/Row";
import Col from "../../layout/Col";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import TextButton from "../../elements/TextButton";
import Tooltip from "../../elements/Tooltip";
import RadioButtonBox from "../../elements/RadioButtonBox";
import { UpdatedImport } from "./UpdateImportsTaskpane";
import { TaskpaneType } from "../taskpanes";


interface DataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
    updatedImports: UpdatedImport[];
    importIndex: number;
}



/* 
    This is the DataframeImport taskpane, allows users to import a specific dataframe
*/
const UpdateImportWithDataframeTaskpane = (props: DataframeImportTaskpaneProps): JSX.Element => {

    const [dfNamesInNotebook, setDfNamesInNotebook] = useState<string[]>([]);
    const [selectedDFName, setSelectedDFName] = useState<string>('')

    useEffect(() => {
        const loadDefinedDfNames = async () => {
            const _definedDfNames = await props.mitoAPI.getDefinedDfNames();
            if (_definedDfNames !== undefined) {
                setDfNamesInNotebook(_definedDfNames.df_names)
                console.log('notebooks to show:', _definedDfNames.df_names)
            }
        }
        void loadDefinedDfNames();
    }, []);

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
                </Row>
                <Row>
                    <RadioButtonBox 
                        values={dfNamesInNotebook} 
                        selectedValue={selectedDFName} 
                        onChange={setSelectedDFName}          
                    />
                </Row>
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => {
                        const newUpdatedImports: UpdatedImport[] = JSON.parse(JSON.stringify(props.updatedImports))
                        newUpdatedImports[props.importIndex] = {
                            ...newUpdatedImports[props.importIndex],
                            type: 'df',
                            import_params: {
                                df_names: [selectedDFName]
                            }                            
                        }

                        console.log('new udpated imports: ', newUpdatedImports)
                        props.setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenTaskpane: {type: TaskpaneType.UPDATEIMPORTS, updatedImports: newUpdatedImports}
                            }
                        })
                    }}
                    disabled={selectedDFName === ''}
                >
                    Import Dataframes
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateImportWithDataframeTaskpane;