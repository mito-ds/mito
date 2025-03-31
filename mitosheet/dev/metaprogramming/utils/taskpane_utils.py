# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from pathlib import Path
from typing import Dict, List, Tuple

from metaprogramming.utils.code_utils import (
    CLOSE_BRACKET, OPEN_BRACKET, get_default_typescript_value_for_param,
    get_typescript_type_for_param)


def get_taskpane_imports(params: Dict[str, str], is_live_updating_taskpane: bool, used_elements: List[str]) -> str:
    imports = ''

    # Import for hook
    if is_live_updating_taskpane:
        imports += "import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';\n"
    else:
        imports += "import useSendEditOnClick from '../../../hooks/useSendEditOnClick';\n"

    # Import for params
    added_column_id = False
    for param_type in set(params.values()):
        if 'ColumnID' in param_type and not added_column_id:
            imports += 'import { ColumnID } from "../../../types"\n'
            added_column_id = True
        if param_type == 'List[ColumnID]':
            imports += 'import { getDtypeValue } from "../ControlPanel/FilterAndSortTab/DtypeCard";\n'
            imports += 'import { getDisplayColumnHeader } from "../../../utils/columnHeaders";\n'
            imports += 'import { addIfAbsent, removeIfPresent } from "../../../utils/arrays";\n'

    # Import for elements
    for element in set(used_elements):
        if element == 'Row':
            imports += "import Row from '../../layout/Row';\n"
        elif element == 'Col':
            imports += "import Col from '../../layout/Col';\n"
        elif element == 'Select':
            imports += "import Select from '../../elements/Select';\n"
        elif element == 'DropdownItem':
            imports += "import DropdownItem from '../../elements/DropdownItem';\n"
        elif element == 'Input':
            imports += "import Input from '../../elements/Input';\n"
        elif element == 'Toggle':
            imports += "import Toggle from '../../elements/Toggle';\n"
        elif element == 'MultiToggleBox':
            imports += "import MultiToggleBox from '../../elements/MultiToggleBox';\n"
        elif element == 'MultiToggleItem':
            imports += "import MultiToggleItem from '../../elements/MultiToggleItem';\n"
        elif element == 'DataframeSelect':
            imports += "import DataframeSelect from '../../elements/DataframeSelect';\n"
            
        else:
            raise Exception(f'{element} needs to have a import statement defined')
        
    return imports



def get_param_user_input_code(param_name: str, param_type: str) -> Tuple[str, List[str]]:

    # If this is selecting a sheet index, use a sheet index select
    if 'sheet_index' in param_name and param_type == 'int':

        # Row, Col, Select, DropdownItem
        return (f"""<DataframeSelect 
                    sheetDataArray={OPEN_BRACKET}props.sheetDataArray{CLOSE_BRACKET}
                    sheetIndex={OPEN_BRACKET}params.{param_name}{CLOSE_BRACKET}
                    onChange={OPEN_BRACKET}(newSheetIndex) => {OPEN_BRACKET}
                        setParams(prevParams => {OPEN_BRACKET}
                            const newParams = getDefaultParams(props.sheetDataArray, newSheetIndex);
                            if (newParams) {OPEN_BRACKET}
                                return newParams;
                            {CLOSE_BRACKET}
                            return {OPEN_BRACKET}
                                ...prevParams,
                                {param_name}: newSheetIndex
                            {CLOSE_BRACKET}
                        {CLOSE_BRACKET});
                    {CLOSE_BRACKET}{CLOSE_BRACKET}
                    />""", ['DataframeSelect'])
    if param_type == 'int' or param_type == 'float':
        # TODO: number input
        return ('<NumberInput>', [])
    elif param_type == 'str':
        # TODO: string input
        return (f"""<Row justify='space-between' align='center' title='TODO'>
                        <Col>
                            <p className='text-header-3'>
                                {param_name}
                            </p>
                        </Col>
                        <Col>
                            <Input
                                autoFocus
                                width='medium'
                                value={OPEN_BRACKET}'' + params.{param_name}{CLOSE_BRACKET}
                                onChange={OPEN_BRACKET}(e) => {OPEN_BRACKET}
                                    const newValue = e.target.value;
                                    
                                    setParams(prevParams => {OPEN_BRACKET}
                                        return {OPEN_BRACKET}
                                            ...prevParams,
                                            {param_name}: newValue
                                        {CLOSE_BRACKET}
                                    {CLOSE_BRACKET})
                                {CLOSE_BRACKET}{CLOSE_BRACKET}
                            />
                        </Col>
                    </Row>""", ['Row', 'Col', 'Input'])
    elif param_type == 'bool':
        # TODO: toggle
        return (f"""<Row justify='space-between' align='center'>
                    <Col>
                            <p className='text-header-3'>
                                {param_name}
                            </p>
                        </Col>
                    <Col>
                        <Toggle 
                            value={OPEN_BRACKET}params.{param_name}{CLOSE_BRACKET}
                            onChange={OPEN_BRACKET}() => {OPEN_BRACKET}
                                setParams(prevConcatParams => {OPEN_BRACKET}
                                    return {OPEN_BRACKET}
                                        ...prevConcatParams,
                                        {param_name}: !prevConcatParams.{param_name}
                                    {CLOSE_BRACKET}
                                {CLOSE_BRACKET})
                            {CLOSE_BRACKET}{CLOSE_BRACKET}                      
                        />
                    </Col>
                </Row>""", ['Row', 'Col', 'Toggle'])
    elif param_type == 'ColumnID':
        # TODO: Do a select here
        return ('<Select>', [])
    elif param_type == 'List[ColumnID]':
        # TODO: multiselect or the other one
        return (f"""<Row justify='space-between' align='center' title='TODO'>
                    <Col>
                        <p className='text-header-3'>
                            {param_name}
                        </p>
                    </Col>
                </Row>
                <MultiToggleBox
                    searchable
                    toggleAllIndexes={OPEN_BRACKET}(indexesToToggle, newValue) => {OPEN_BRACKET}
                        toggleIndexes('{param_name}', indexesToToggle, newValue)
                    {CLOSE_BRACKET}{CLOSE_BRACKET}
                    height='medium'
                >
                    {OPEN_BRACKET}Object.entries(sheetData?.columnDtypeMap || {OPEN_BRACKET}{CLOSE_BRACKET}).map(([columnID, columnDtype], index) => {OPEN_BRACKET}
                        const columnIDsMap = sheetData?.columnIDsMap || {OPEN_BRACKET}{CLOSE_BRACKET}
                        const columnHeader = columnIDsMap[columnID];
                        const toggle = params.{param_name}.includes(columnID);

                        return (
                            <MultiToggleItem
                                key={OPEN_BRACKET}index{CLOSE_BRACKET}
                                index={OPEN_BRACKET}index{CLOSE_BRACKET}
                                title={OPEN_BRACKET}getDisplayColumnHeader(columnHeader){CLOSE_BRACKET}
                                rightText={OPEN_BRACKET}getDtypeValue(columnDtype){CLOSE_BRACKET}
                                toggled={OPEN_BRACKET}toggle{CLOSE_BRACKET}
                                onToggle={OPEN_BRACKET}() => {OPEN_BRACKET}
                                    toggleIndexes('{param_name}', [index], !toggle)
                                {CLOSE_BRACKET}{CLOSE_BRACKET}
                            />
                        ) 
                    {CLOSE_BRACKET}){CLOSE_BRACKET}
                </MultiToggleBox>""", ['Row', 'Col', 'MultiToggleBox', 'MultiToggleItem'])
    else:
        # TODO: It doesn't do this!
        return (f'{OPEN_BRACKET}/* TODO: add the user input for {param_name} of type {param_type} */{CLOSE_BRACKET}', [])



def get_taskpane_body_code(params: Dict[str, str]) -> Tuple[str, List[str]]:
    # We just do the params in a linear order

    taskpane_body_code = ""
    used_elements = []
    for param_name, param_type in params.items():
        (body_code, elements) = get_param_user_input_code(param_name, param_type)
        taskpane_body_code += f'{body_code}\n'
        used_elements += elements
    
    return (taskpane_body_code, used_elements)


def get_params_interface_code(original_step_name: str, params: Dict[str, str]) -> str:
    if len(params) == 0:
        return ''
    
    step_name_capital = original_step_name.replace(' ', '')

    params_interface = f"interface {step_name_capital}Params {OPEN_BRACKET}\n"
    for param_name, param_type in params.items():
        params_interface += f'    {param_name}: {get_typescript_type_for_param(param_name, param_type)},\n'
    params_interface += "}"

    return params_interface

def get_default_params_value(params: Dict[str, str]) -> str:
    default_params = "{\n"
    for param_name, param_type in params.items():
        default_params += f'        {param_name}: {get_default_typescript_value_for_param(param_name, param_type)},\n'
    default_params += "    }"
    return default_params

def get_default_params(taskpane_name_capital: str, params: Dict[str, str]) -> str:
    if len(params) == 0:
        return ''

    return f"""const getDefaultParams = (
    sheetDataArray: SheetData[], 
    sheetIndex: number,
): {taskpane_name_capital}Params | undefined => {OPEN_BRACKET}

    if (sheetDataArray.length === 0 || sheetDataArray[sheetIndex] === undefined) {OPEN_BRACKET}
        return undefined;
    {CLOSE_BRACKET}

    return {get_default_params_value(params)}
{CLOSE_BRACKET}"""


def get_effect_code(original_step_name: str, params: Dict[str, str], is_live_updating_taskpane: bool) -> str:
    if len(params) == 0:
        return ''

    step_name_capital = original_step_name.replace(' ', '')
   
    if is_live_updating_taskpane:
        return f"""const {OPEN_BRACKET}params, setParams{CLOSE_BRACKET} = useLiveUpdatingParams(
        () => getDefaultParams(props.sheetDataArray, props.selectedSheetIndex),
        StepType.{step_name_capital}, 
        props.mitoAPI,
        props.analysisData,
        50
    )"""
    else:
        return f"""const {OPEN_BRACKET}params, setParams, loading, edit, editApplied{CLOSE_BRACKET} = useSendEditOnClick<{step_name_capital}Params, undefined>(
            () => getDefaultParams(props.sheetDataArray, props.selectedSheetIndex),
            StepType.{step_name_capital}, 
            props.mitoAPI,
            props.analysisData,
        )"""


def get_sheet_data_definition(params: Dict[str, str]) -> str:
    if 'sheet_index' not in params.keys():
        return ''
    else:
        return 'const sheetData = props.sheetDataArray[params.sheet_index];'



def get_toggle_all_code(params: Dict[str, str]) -> str:

    # First, find all the multi-toggle box 
    multi_toggle_box_params = list(filter(lambda x: x[1] == 'List[ColumnID]', params.items()))

    if len(multi_toggle_box_params) == 0:
        return ''

    param_name_type = '|'.join(map(lambda x: f'\'{x[0]}\'', multi_toggle_box_params))

    return f"""const toggleIndexes = (param_name: {param_name_type}, indexes: number[], newToggle: boolean): void => {OPEN_BRACKET}
        const columnIds = Object.keys(props.sheetDataArray[params.sheet_index]?.columnIDsMap) || [];
        const columnIdsToToggle = indexes.map(index => columnIds[index]);

        const newColumnIds = [...params[param_name]];

        columnIdsToToggle.forEach(columnID => {OPEN_BRACKET}
            if (newToggle) {OPEN_BRACKET}
                addIfAbsent(newColumnIds, columnID);
            {CLOSE_BRACKET} else {OPEN_BRACKET}
                removeIfPresent(newColumnIds, columnID);
            {CLOSE_BRACKET}
        {CLOSE_BRACKET})

        setParams(prevParams => {OPEN_BRACKET}
            return {OPEN_BRACKET}
                ...prevParams,
                [param_name]: newColumnIds
            {CLOSE_BRACKET}
        {CLOSE_BRACKET})
    {CLOSE_BRACKET}"""


def get_params_undefined_code(params: Dict[str, str]) -> str:
    if len(params) == 0:
        return ''

    return f"""if (params === undefined) {OPEN_BRACKET}
        return <DefaultEmptyTaskpane setUIState={OPEN_BRACKET}props.setUIState{CLOSE_BRACKET}/>
    {CLOSE_BRACKET}"""


def get_new_taskpane_code(original_taskpane_name: str, params: Dict[str, str], is_live_updating_taskpane: bool) -> str:

    taskpane_name_capital = original_taskpane_name.replace(' ', '')

    (body_code, used_elements) = get_taskpane_body_code(params)

    return f"""import React from "react";
import MitoAPI from "../../../jupyter/api";
import {OPEN_BRACKET} AnalysisData, SheetData, StepType, UIState, UserProfile {CLOSE_BRACKET} from "../../../types"
{get_taskpane_imports(params, is_live_updating_taskpane, used_elements)}
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";


interface {taskpane_name_capital}TaskpaneProps {OPEN_BRACKET}
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
{CLOSE_BRACKET}

{get_params_interface_code(taskpane_name_capital, params)}
{get_default_params(taskpane_name_capital, params)}


/* 
    This is the {original_taskpane_name} taskpane.
*/
const {taskpane_name_capital}Taskpane = (props: {taskpane_name_capital}TaskpaneProps): JSX.Element => {OPEN_BRACKET}

    {get_effect_code(original_taskpane_name, params, is_live_updating_taskpane)}

    {get_params_undefined_code(params)}

    {get_sheet_data_definition(params)}

    {get_toggle_all_code(params)}

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="{original_taskpane_name}"
                setUIState={OPEN_BRACKET}props.setUIState{CLOSE_BRACKET}           
            />
            <DefaultTaskpaneBody>
                {body_code}
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
{CLOSE_BRACKET}

export default {taskpane_name_capital}Taskpane;"""

