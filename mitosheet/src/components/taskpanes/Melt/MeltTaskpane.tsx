import React from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types"
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import { ColumnID } from "../../../types"
import { getDtypeValue } from "../ControlPanel/FilterAndSortTab/DtypeCard";
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
        value_var_column_ids: [],
    }
}


/* 
    This taskpane allows you to melt
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
                header="Melt"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center' title='Select a dataframe TODO.'>
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
                </Row><Row justify='space-between' align='center' title='TODO'>
                    <Col>
                        <p className='text-header-3'>
                            id_var_column_ids
                        </p>
                    </Col>
                </Row>
                <MultiToggleBox
                    searchable
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
                </MultiToggleBox><Row justify='space-between' align='center' title='TODO'>
                    <Col>
                        <p className='text-header-3'>
                            value_var_column_ids
                        </p>
                    </Col>
                </Row>
                <MultiToggleBox
                    searchable
                    toggleAllIndexes={(indexesToToggle, newValue) => {
                        toggleIndexes('value_var_column_ids', indexesToToggle, newValue)
                    }}
                    height='medium'
                >
                    {Object.entries(sheetData?.columnDtypeMap || {}).map(([columnID, columnDtype], index) => {
                        const columnIDsMap = sheetData?.columnIDsMap || {}
                        const columnHeader = columnIDsMap[columnID];
                        const toggle = params.value_var_column_ids.includes(columnID);

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
                            />
                        ) 
                    })}
                </MultiToggleBox>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default MeltTaskpane;