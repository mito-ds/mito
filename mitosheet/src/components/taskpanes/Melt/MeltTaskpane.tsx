import React from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types"
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import { ColumnID } from "../../../types"
import { getDtypeValue } from "../ControlPanel/SortDtypeTab/DtypeCard";
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import { addIfAbsent, removeIfPresent } from "../../../utils/arrays";
import DropdownItem from '../../elements/DropdownItem';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import Select from '../../elements/Select';
import MultiToggleItem from '../../elements/MultiToggleItem';
import MultiToggleBox from '../../elements/MultiToggleBox';

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import Spacer from "../../spacing/Spacer";
import Tooltip from "../../elements/Tooltip";


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

    const {params, setParams} = useLiveUpdatingParams(
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

    const toggleIndexes = (param_name: 'id_var_column_ids'|'value_var_column_ids', indexes: number[], newToggle: boolean): void => {
        const columnIds = Object.keys(props.sheetDataArray[params.sheet_index]?.columnIDsMap) || [];
        const columnIdsToToggle = indexes.map(index => columnIds[index]);

        const newColumnIds = [...params[param_name]];

        columnIdsToToggle.forEach(columnID => {
            if (newToggle) {
                addIfAbsent(newColumnIds, columnID);
            } else {
                removeIfPresent(newColumnIds, columnID);
            }
        })

        setParams(prevParams => {
            return {
                ...prevParams,
                [param_name]: newColumnIds
            }
        })
    }

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Unpivot Dataframe"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center' title='Select a dataframe to unpivot.'>
                    <Col>
                        <p className='text-header-3'>
                            Dataframe
                        </p>
                    </Col>
                    <Col>
                        <Select
                            value={props.sheetDataArray[params.sheet_index]?.dfName}
                            onChange={(newDfName: string) => {
                                const newSheetIndex = props.sheetDataArray.findIndex((sheetData) => {
                                    return sheetData.dfName == newDfName;
                                })
                                
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
                            width='medium'
                        >
                            {props.sheetDataArray.map(sheetData => {
                                return (
                                    <DropdownItem
                                        key={sheetData.dfName}
                                        title={sheetData.dfName}
                                    />
                                )
                            })}
                        </Select>
                    </Col>
                </Row>
                <Row justify='start' align='center' title='Column to use as identifier variables.'>
                    <Col>
                        <p className='text-header-3'>
                            ID Variables
                        </p>
                    </Col>
                    <Col offset={.5}>
                        <Tooltip title={"Column to use as identifier variables. These columns will be present in the unpivoted dataframe."}/>
                    </Col>
                </Row>
                <MultiToggleBox
                    searchable
                    searchRightText
                    toggleAllIndexes={(indexesToToggle, newValue) => {
                        toggleIndexes('id_var_column_ids', indexesToToggle, newValue)
                    }}
                    height='medium'
                >
                    {Object.entries(sheetData?.columnDtypeMap || {}).map(([columnID, columnDtype], index) => {
                        const columnIDsMap = sheetData?.columnIDsMap || {}
                        const columnHeader = columnIDsMap[columnID];
                        const toggle = params.id_var_column_ids.includes(columnID);

                        return (
                            <MultiToggleItem
                                key={index}
                                index={index}
                                title={getDisplayColumnHeader(columnHeader)}
                                rightText={getDtypeValue(columnDtype)}
                                toggled={toggle}
                                onToggle={() => {
                                    toggleIndexes('id_var_column_ids', [index], !toggle)
                                }}
                            />
                        ) 
                    })}
                </MultiToggleBox>
                <Spacer px={10}/>
                <Row justify='start' align='center' title='Columns to unpivot.'>
                    <Col>
                        <p className='text-header-3'>
                            Values
                        </p>
                    </Col>
                    <Col offset={.5}>
                        <Tooltip title={"Column to unpivot. Each column header will go in the variables column, and the column values will go in the values column."}/>
                    </Col>
                </Row>
                <MultiToggleBox
                    searchable
                    searchRightText
                    toggleAllIndexes={(indexesToToggle, newValue) => {
                        toggleIndexes('value_var_column_ids', indexesToToggle, newValue)
                    }}
                    height='medium'
                >
                    {Object.entries(sheetData?.columnDtypeMap || {}).map(([columnID, columnDtype], index) => {
                        const columnIDsMap = sheetData?.columnIDsMap || {}
                        const columnHeader = columnIDsMap[columnID];
                        // We turn off and disable the toggle in the case it is included in the id variables, 
                        // as pandas automatically filters the id variables out from the value variables
                        const toggle = params.id_var_column_ids.includes(columnID) ? false : params.value_var_column_ids.includes(columnID);
                        const disabled = params.id_var_column_ids.includes(columnID);

                        return (
                            <MultiToggleItem
                                key={index}
                                index={index}
                                title={getDisplayColumnHeader(columnHeader)}
                                rightText={getDtypeValue(columnDtype)}
                                toggled={toggle}
                                onToggle={() => {
                                    toggleIndexes('value_var_column_ids', [index], !toggle)
                                }}
                                disabled={disabled}
                            />
                        ) 
                    })}
                </MultiToggleBox>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default MeltTaskpane;