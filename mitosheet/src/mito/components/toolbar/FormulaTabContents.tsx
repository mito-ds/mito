/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */



import React from 'react'

import ToolbarButton from './ToolbarButton';
import Dropdown from '../elements/Dropdown';
import { ActionEnum, AnalysisData, EditorState, GridState, SheetData, UIState } from '../../types';
import { Actions } from '../../utils/actions';
import DropdownItem from '../elements/DropdownItem';
import { functionDocumentationObjects, FunctionCategory } from '../../data/function_documentation';
import { getStartingFormula } from '../endo/celleditor/cellEditorUtils';

export const FormulaTabContents = (
    props: {
        actions: Actions;
        gridState: GridState;
        uiState: UIState;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        sheetData: SheetData;
        editorState: EditorState | undefined;
        setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
        analysisData: AnalysisData;
        mitoContainerRef: React.RefObject<HTMLDivElement>;
    }): JSX.Element => {

    /**
     * Maps the formula categories to the corresponding action enum
     */
    const formulaCategories: { [category in FunctionCategory]: ActionEnum } = {
        'FINANCE': ActionEnum.Formulas_Dropdown_Finance,
        'LOGIC': ActionEnum.Formulas_Dropdown_Logic,
        'TEXT': ActionEnum.Formulas_Dropdown_Text,
        'DATE': ActionEnum.Formulas_Dropdown_DateTime,
        'REFERENCE': ActionEnum.Formulas_Dropdown_Reference,
        'MATH': ActionEnum.Formulas_Dropdown_Math,
    };

    const getFormulaDropdownItems = (category?: string): JSX.Element[] => {
        let functionsInCategory = []
        if (category === 'custom') {
            functionsInCategory = props.analysisData.userDefinedFunctions
        } else {
            functionsInCategory = functionDocumentationObjects.filter(
                functionObject => functionObject.category === category
            );
        }
        return functionsInCategory.map(functionObject => {
            return (
                <DropdownItem
                    title={functionObject.function}
                    tooltip={functionObject.description}
                    key={functionObject.function}
                    supressFocusSettingOnClose
                    onClick={(e) => {
                        e?.stopPropagation();
                        // If the user is currently editing a cell, we only want to update the formula
                        if (props.editorState !== undefined) {
                            const currentFormula = props.editorState.formula;
                            props.setEditorState({
                                ...props.editorState,
                                formula: `=${functionObject.function}(${currentFormula.startsWith('=') ? currentFormula.substring(1) : currentFormula}`,
                            })
                            void (props.mitoContainerRef.current?.querySelector('#cell-editor-input') as HTMLElement).focus();
                        } else {
                            const rowIndex = props.gridState.selections[0].startingRowIndex;
                            const columnIndex = props.gridState.selections[0].startingColumnIndex;
                            const {startingColumnFormula, arrowKeysScrollInFormula, editingMode} = getStartingFormula(props.sheetData, props.editorState, rowIndex, columnIndex, false);
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
                        }
                    }}
                />
            )
        });
    }

    const getFormulaDropdown = (action: ActionEnum, category?: string) => {
        const toolbarDropdown = `formula-${(category ?? 'more').toLocaleLowerCase()}`;
        return (
            <ToolbarButton action={props.actions.buildTimeActions[action]}> 
                <Dropdown
                    display={props.uiState.currOpenDropdown === toolbarDropdown}
                    closeDropdown={() => 
                        props.setUIState(prevUIState => {
                            if (prevUIState.currOpenDropdown !== toolbarDropdown) {
                                return prevUIState;
                            }

                            return {
                                ...prevUIState,
                                currOpenDropdown: undefined
                            }
                        })
                    }
                    width={category === 'DATE' ? 'large' : 'medium'}
                >
                    {getFormulaDropdownItems(category)}
                </Dropdown>
            </ToolbarButton>
        );
    }

    return (<div className='mito-toolbar-bottom'>
        <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.Set_Column_Formula]} />
        <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.Add_Column_Right]} />

        <div className="toolbar-vertical-line"/>

        {(Object.keys(formulaCategories) as FunctionCategory[]).map((category: FunctionCategory) => {
            // We don't want to display the finance category in the toolbar because we don't currently have any finance functions
            if (category === 'FINANCE') {
                return null;
            }
            return getFormulaDropdown(formulaCategories[category], category)
        })}
        {getFormulaDropdown(ActionEnum.Formulas_Dropdown_Custom, 'custom')}
        {getFormulaDropdown(ActionEnum.Formulas_Dropdown_More)}
    </div>);
}