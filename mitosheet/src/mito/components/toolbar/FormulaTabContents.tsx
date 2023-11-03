// Copyright (c) Mito


import React from 'react'

import ToolbarButton from './ToolbarButton';
import Dropdown from '../elements/Dropdown';
import { ActionEnum, AnalysisData, EditorState, GridState, SheetData, UIState, UserProfile } from '../../types';
import { MitoAPI } from '../../api/api';
import { Actions } from '../../utils/actions';
import DropdownItem from '../elements/DropdownItem';
import { functionDocumentationObjects } from '../../data/function_documentation';
import { getStartingFormula } from '../endo/celleditor/cellEditorUtils';

export const FormulaTabContents = (
    props: {
        mitoAPI: MitoAPI
        currStepIdx: number;
        lastStepIndex: number;
        highlightPivotTableButton: boolean;
        highlightAddColButton: boolean;
        actions: Actions;
        gridState: GridState;
        uiState: UIState;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        sheetData: SheetData;
        userProfile: UserProfile;
        editorState: EditorState | undefined;
        setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
        analysisData: AnalysisData,
        sheetIndex: number,
        closeOpenEditingPopups: () => void
    }): JSX.Element => {

    const getFormulaDropdownItems = (category?: string): JSX.Element[] => {
        const functionsInCategory = functionDocumentationObjects.filter(
            functionObject => functionObject.category === category
        );
        return functionsInCategory.map(functionObject => {
            return (
                <DropdownItem
                    title={functionObject.function}
                    key={functionObject.function}
                    onClick={(e) => {
                        e?.stopPropagation();
                        const rowIndex = props.gridState.selections[0].startingRowIndex;
                        const columnIndex = props.gridState.selections[0].startingColumnIndex;
                        const {startingColumnFormula, arrowKeysScrollInFormula, editingMode} = getStartingFormula(props.sheetData, props.editorState, rowIndex, columnIndex);
                        const newFormula = `=${functionObject.function}(${startingColumnFormula.startsWith('=') ? startingColumnFormula.substring(1) : startingColumnFormula}`;
                        props.setEditorState({
                            rowIndex: Math.max(rowIndex, 0),
                            columnIndex: Math.max(columnIndex, 0),
                            formula: newFormula,
                            arrowKeysScrollInFormula: arrowKeysScrollInFormula,
                            editorLocation: 'cell',
                            editingMode: editingMode,
                            sheetIndex: props.gridState.selections[0].sheetIndex,
                        })
                    }}
                />
            )
        });
    }

    const formulaCategories: { [category: string]: ActionEnum } = {
        'MATH': ActionEnum.Formulas_Dropdown_Math,
        'LOGIC': ActionEnum.Formulas_Dropdown_Logic,
        'TEXT': ActionEnum.Formulas_Dropdown_Text,
        'DATE': ActionEnum.Formulas_Dropdown_DateTime,
        'REFERENCE': ActionEnum.Formulas_Dropdown_Reference,
    };

    const getFormulaDropdown = (action: ActionEnum, category?: string) => {
        return (
            <ToolbarButton
                action={props.actions.buildTimeActions[action]}
                setEditorState={props.setEditorState}
            > 
                <Dropdown
                    display={props.uiState.toolbarDropdown === (category ?? 'MORE')}
                    closeDropdown={() => 
                        props.setUIState(prevUIState => {
                            if (prevUIState.toolbarDropdown !== (category ?? 'MORE')) {
                                return prevUIState;
                            }

                            return {
                                ...prevUIState,
                                toolbarDropdown: undefined
                            }
                        })
                    }
                    // If there are any custom importers, we want to make the dropdown wider
                    width={props.actions.runtimeImportActionsList.length > 0 ? 'large' : 'medium'}
                >
                    {getFormulaDropdownItems(category)}
                </Dropdown>
            </ToolbarButton>
        );
    }

    return (<div className='mito-toolbar-bottom'>
        {Object.keys(formulaCategories).map(category => {
            return getFormulaDropdown(formulaCategories[category], category)
        })}
        {getFormulaDropdown(ActionEnum.Formulas_Dropdown_More)}
    </div>);
}