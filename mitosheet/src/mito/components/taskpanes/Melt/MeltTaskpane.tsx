import React from "react";
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import { MitoAPI } from "../../../api/api";
import { AnalysisData, ColumnID, SheetData, StepType, UIState, UserProfile } from "../../../types";
import DataframeSelect from "../../elements/DataframeSelect";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import MultiToggleColumns from "../../elements/MultiToggleColumns";
import Row from '../../layout/Row';
import Spacer from "../../layout/Spacer";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";


interface MeltTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

interface MeltParams {
    sheet_index: number,
    id_var_column_ids: ColumnID[],
    value_var_column_ids: ColumnID[],
}


const getDefaultParams = (
    sheetDataArray: SheetData[], 
    sheetIndex: number,
): MeltParams | undefined => {

    if (sheetDataArray.length === 0 || sheetDataArray[sheetIndex] === undefined) {
        return undefined;
    }

    return {
        sheet_index: sheetIndex,
        id_var_column_ids: [],
        value_var_column_ids: Object.keys(sheetDataArray[sheetIndex].columnDtypeMap || {}),
    }
}


/* 
    This taskpane allows you to melt or unpivot a dataframe
*/
const MeltTaskpane = (props: MeltTaskpaneProps): JSX.Element => {

    const {params, setParams} = useLiveUpdatingParams<MeltParams, MeltParams>(
        () => getDefaultParams(props.sheetDataArray, props.selectedSheetIndex),
        StepType.Melt, 
        props.mitoAPI,
        props.analysisData,
        50
    )

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const sheetData = props.sheetDataArray[params.sheet_index];

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Unpivot Dataframe"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <DataframeSelect
                    title='Select a dataframe to unpivot.'
                    sheetDataArray={props.sheetDataArray}
                    sheetIndex={params.sheet_index}
                    onChange={(newSheetIndex) => {
                        setParams(prevParams => {
                            const newParams = getDefaultParams(props.sheetDataArray, newSheetIndex);
                            if (newParams) {
                                return newParams;
                            }
                            return {
                                ...prevParams,
                                sheet_index: newSheetIndex
                            }
                        });
                    }}
                />
                <Row justify='start' align='center' title='Column to use as identifier variables.'>
                    <LabelAndTooltip tooltip="Column to use as identifier variables. These columns will be present in the unpivoted dataframe.">
                        ID Variables
                    </LabelAndTooltip>
                </Row>
                <MultiToggleColumns
                    sheetData={sheetData}
                    selectedColumnIDs={params.id_var_column_ids}
                    onChange={(newSelectedColumnIDs: ColumnID[]) => {
                        setParams(oldDropDuplicateParams => {
                            return {
                                ...oldDropDuplicateParams,
                                id_var_column_ids: newSelectedColumnIDs
                            }
                        })
                    }}
                />
                <Spacer px={10}/>
                <Row justify='start' align='center' title='Columns to unpivot.'>
                    <LabelAndTooltip tooltip="Column to unpivot. Each column header will go in the variables column, and the column values will go in the values column.">
                        Values
                    </LabelAndTooltip>
                </Row>
                <MultiToggleColumns
                    sheetData={sheetData}
                    selectedColumnIDs={params.value_var_column_ids.filter(cid => !params.id_var_column_ids.includes(cid))}
                    disabledColumnIDs={params.id_var_column_ids}
                    onChange={(newSelectedColumnIDs: ColumnID[]) => {
                        setParams(oldDropDuplicateParams => {
                            return {
                                ...oldDropDuplicateParams,
                                value_var_column_ids: newSelectedColumnIDs
                            }
                        })
                    }}
                />
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default MeltTaskpane;