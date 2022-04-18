import React from 'react';
import { FilterIcon } from '../icons/FilterIcons';
import '../../../css/endo/ColumnHeaders.css';
import { DEFAULT_BORDER_STYLE, getBorderStyle, getIsCellSelected } from './selectionUtils';
import { EditorState, GridState, SheetData, UIState } from '../../types';
import { getCellDataFromCellIndexes, getTypeIdentifier } from './utils';
import MitoAPI from '../../jupyter/api';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { classNames } from '../../utils/classNames';
import Input from '../elements/Input';
import { focusGrid } from './focusUtils';
import { getColumnHeaderParts, getDisplayColumnHeader, isPrimitiveColumnHeader, rowIndexToColumnHeaderLevel } from '../../utils/columnHeaders';
import { DEFAULT_HEIGHT } from './EndoGrid';
import { ControlPanelTab } from '../taskpanes/ControlPanel/ControlPanelTaskpane';


/* 
    A single column header at the top of the sheet. If the edited
    cell is this header, then displays an input that allows the user
    to rename the header.

    This header component handles if the column header is a single
    basic header (e.g. a string or number or boolean) or if the
    header is a MultiIndex header (e.g. it is a tuple), in which
    case it displays the header in pieces from lower level to 
    the final and highest level. 

    Consider the following dataframe df:
              A
            count
    0 	1 	1000000

    This has df.columns = [('A', ''), ('A', 'count')]. In pandas lingo, 
    'A' is the lowest level column header, and '' and 'count' are the 
    highest (and final) level column headers. 

    In Endo, we display these column headers as 'A' and 'A, count'. Specifically
    the 'A' column header will not appear to have any lower level column headers
    displayed. 'A, count' will have a top (thin) header of 'A', and then a final
    header of 'count'.
*/
const ColumnHeader = (props: {
    gridState: GridState,
    sheetData: SheetData,
    editorState: EditorState | undefined;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    columnIndex: number,
    containerRef: React.RefObject<HTMLDivElement>;
    columnHeaderOperation: 'reorder' | 'resize' | undefined;
    setColumnHeaderOperation: React.Dispatch<React.SetStateAction<'reorder' | 'resize' | undefined>>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI;
}): JSX.Element => {

    const selected = getIsCellSelected(props.gridState.selections, -1, props.columnIndex);
    const width = props.gridState.widthDataArray[props.gridState.sheetIndex].widthArray[props.columnIndex];
    const { columnID, columnFilters, columnHeader, columnDtype } = getCellDataFromCellIndexes(props.sheetData, -1, props.columnIndex);

    if (columnID === undefined || columnFilters === undefined || columnDtype == undefined || columnHeader === undefined) {
        return <></>
    }

    const hasFilters = columnFilters.filters.length > 0;
    const editingColumnHeader = props.editorState !== undefined && props.editorState.rowIndex <= -1 && props.editorState.columnIndex === props.columnIndex;
    const editingFinalColumnHeader = props.editorState !== undefined && props.editorState.rowIndex === -1 && props.editorState.columnIndex === props.columnIndex;


    const closeColumnHeaderEditor = () => {
        props.setEditorState(undefined);
        // We then focus on the grid, as we are no longer focused on the editor
        setTimeout(() => focusGrid(props.containerRef.current), 100);
    }

    // Get the pieces of the column header. If the column header is not a MultiIndex header, then
    // lowerLevelColumnHeaders will be an empty array
    const { lowerLevelColumnHeaders, finalColumnHeader } = getColumnHeaderParts(columnHeader);
    const borderStyle = getBorderStyle(props.gridState.selections, -1, props.columnIndex, props.sheetData.numRows);

    const ColumnHeaderResizer = (
        <div
            className='column-header-resizer'
            onDragStart={(e) => {
                e.stopPropagation();
                // Mark that this is a resize
                e.dataTransfer.setData("operation", 'resize');
                e.dataTransfer.setData("mito-col-index", props.columnIndex + '');
                props.setColumnHeaderOperation('resize');
            }}
            onDragEnd={() => {
                props.setColumnHeaderOperation(undefined);
            }}
            draggable="true"
        />
    )

    const submitRenameColumnHeader = async (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) {
            e.preventDefault();
        }

        // Only submit the formula if it actually has changed
        const newColumnHeader = props.editorState?.formula || getDisplayColumnHeader(finalColumnHeader);
        const oldColumnHeader = getDisplayColumnHeader(finalColumnHeader);
        if (newColumnHeader !== oldColumnHeader) {
            const levelIndex = isPrimitiveColumnHeader(columnHeader) ? undefined : rowIndexToColumnHeaderLevel(columnHeader, -1);
            void props.mitoAPI.editRenameColumn(
                props.gridState.sheetIndex,
                columnID,
                newColumnHeader,
                levelIndex
            )

            // Close the taskpane if you do a rename, so that we don't get errors
            // with live updating (e.g. editing a pivot, do a rename, try to edit
            // the same pivot).
            props.setUIState(prevUIState => {
                if (prevUIState.currOpenTaskpane.type !== TaskpaneType.CONTROL_PANEL) {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: { type: TaskpaneType.NONE }
                    }
                }
                return prevUIState;
            })
        }
        closeColumnHeaderEditor()
    }

    return (
        <div
            className={classNames(
                'column-header-container',
                'column-header-text',
                { 'column-header-container-selected': selected }
            )}
            key={props.columnIndex}
            mito-col-index={props.columnIndex + ''}
            onDragStart={(e) => {
                // Mark that this is a reordering that is happening
                e.dataTransfer.setData("operation", 'reorder');
                e.dataTransfer.setData("mito-col-index", props.columnIndex + '');
                props.setColumnHeaderOperation('reorder');
            }}
            onDragEnd={() => {
                props.setColumnHeaderOperation(undefined);
            }}
            title={getDisplayColumnHeader(columnHeader)}
            // We have to make it not draggable when we're editing the column header,
            // so that you can click within the input to move around. This is a FF bug
            // see here: https://newbedev.com/prevent-drag-event-to-interfere-with-input-elements-in-firefox-using-html5-drag-drop
            draggable={!editingColumnHeader ? 'true' : 'false'}
        >
            {lowerLevelColumnHeaders.map((lowerLevelColumnHeader, levelIndex) => {
                // For each lower-level column header, we display them with a row index
                // counting up to -1, which is the highest level column header
                const rowIndex = -1 - (lowerLevelColumnHeaders.length - levelIndex);
                const editingLowerLevelColumnHeader = props.editorState !== undefined && props.editorState.rowIndex === rowIndex && props.editorState.columnIndex === props.columnIndex;

                return (
                    <div
                        className='column-header-lower-level-container'
                        key={levelIndex}
                        mito-row-index={rowIndex + ''}
                        mito-col-index={props.columnIndex}
                        // We get the border style for the header, but make sure we don't add the 
                        // top and bottom borders unnecessarily and double up on things
                        style={{
                            minHeight: DEFAULT_HEIGHT,
                            borderLeft: borderStyle.borderLeft,
                            borderRight: borderStyle.borderRight,
                            borderTop: levelIndex === 0 ? borderStyle.borderTop : undefined,
                            borderBottom: levelIndex < lowerLevelColumnHeaders.length - 1 ? DEFAULT_BORDER_STYLE : undefined,
                        }}
                    >
                        {!editingLowerLevelColumnHeader &&
                            <p
                                className='column-header-lower-level-text text-overflow-hide'
                                style={{
                                    maxWidth: `${width - 25}px`, // Make sure it doesn't overflow
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation(); // stop prop, so we don't call the onclick the header container
                                    props.setEditorState({
                                        rowIndex: rowIndex,
                                        columnIndex: props.columnIndex,
                                        formula: getDisplayColumnHeader(lowerLevelColumnHeader),
                                    })
                                }}
                            >
                                {getDisplayColumnHeader(lowerLevelColumnHeader)}
                            </p>
                        }
                        {editingLowerLevelColumnHeader &&
                            <form
                                style={{
                                    width: `${width - 25}px`,
                                }}
                                onSubmit={async (e) => {
                                    e.preventDefault();

                                    const newColumnHeader = props.editorState?.formula || getDisplayColumnHeader(finalColumnHeader);
                                    const oldColumnHeader = getDisplayColumnHeader(lowerLevelColumnHeader);
                                    if (newColumnHeader !== oldColumnHeader) {
                                        void props.mitoAPI.editRenameColumn(
                                            props.gridState.sheetIndex,
                                            columnID,
                                            newColumnHeader,
                                            levelIndex
                                        )

                                        // Close the taskpane if you do a rename, so that we don't get errors
                                        // with live updating (e.g. editing a pivot, do a rename, try to edit
                                        // the same pivot).
                                        props.setUIState(prevUIState => {
                                            if (prevUIState.currOpenTaskpane.type !== TaskpaneType.CONTROL_PANEL) {
                                                return {
                                                    ...prevUIState,
                                                    currOpenTaskpane: { type: TaskpaneType.NONE }
                                                }
                                            }
                                            return prevUIState;
                                        })
                                    }
                                    closeColumnHeaderEditor()
                                }}
                            >
                                <Input
                                    value={props.editorState?.formula || ''}
                                    onChange={(e) => {
                                        const newHeader = e.target.value;

                                        props.setEditorState((prevEditorState => {
                                            if (prevEditorState === undefined) return undefined;
                                            return {
                                                ...prevEditorState,
                                                formula: newHeader
                                            }
                                        }));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            closeColumnHeaderEditor()
                                        }
                                    }}
                                    autoFocus
                                    width='block'
                                />
                            </form>
                        }
                        {ColumnHeaderResizer}
                    </div>
                )
            })}
            <div
                className={classNames('column-header-final-container', {
                    'grabbable': props.columnHeaderOperation === 'reorder', // Only display as grabbable when we're not resizing a column
                })}
                mito-row-index={'-1'}
                mito-col-index={props.columnIndex}
                onClick={() => {
                    // Don't open the control panel if we're editing, user is selecting column
                    if (editingFinalColumnHeader) {
                        return;
                    }

                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            selectedColumnControlPanelTab: ControlPanelTab.FilterSort,
                            currOpenTaskpane: { type: TaskpaneType.CONTROL_PANEL }
                        }
                    })
                }}
                style={{
                    height: '100%',
                    minHeight: '45px',
                    width: `${width}px`,
                    // Don't add a top border if there a lower level column headers above this
                    // TODO: can we move this all into the border calculation function?
                    borderTop: lowerLevelColumnHeaders.length > 0 ? DEFAULT_BORDER_STYLE : borderStyle.borderTop,
                    borderBottom: borderStyle.borderBottom,
                    borderLeft: borderStyle.borderLeft,
                    borderRight: borderStyle.borderRight,
                }}
            >
                {!editingFinalColumnHeader &&
                    <>
                        <div
                            className='column-header-final-text'
                            onClick={(e) => {
                                e.stopPropagation(); // Stop prop, so we don't call the onclick the header container
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation(); // Stop prop, so we don't call the onclick the header container
                                props.setEditorState({
                                    rowIndex: -1,
                                    columnIndex: props.columnIndex,
                                    formula: getDisplayColumnHeader(finalColumnHeader),
                                })
                            }}
                            key={props.columnIndex}
                            tabIndex={-1}
                        >
                            {/* Only display the final column header in this final section */}
                            {finalColumnHeader + ''}
                        </div>

                        <div className='column-header-final-right-side' >
                            <div className='column-header-final-icons' title='Open the column control panel' >
                                <span title='Edit filters'>
                                    {!hasFilters &&
                                        <div className='icon-color-changer-container'>
                                            <div className='icon-hide-on-hover'>
                                                <FilterIcon purpleOrDark='dark' />
                                            </div>
                                            <div className='icon-show-on-hover'>
                                                <FilterIcon purpleOrDark='purple' />
                                            </div>
                                        </div>
                                    }
                                    {hasFilters &&
                                        <FilterIcon nonEmpty />
                                    }
                                </span>
                                <div className='icon-color-changer-container'>
                                    <div className='icon-hide-on-hover'>
                                        {getTypeIdentifier(columnDtype, 'dark')}
                                    </div>
                                    <div className='icon-show-on-hover'>
                                        {getTypeIdentifier(columnDtype, 'purple')}
                                    </div>
                                </div>

                            </div>
                            {ColumnHeaderResizer}
                        </div>
                    </>
                }
                {editingFinalColumnHeader &&
                    <form
                        className='element-width-block'
                        onSubmit={submitRenameColumnHeader}
                    >
                        <Input
                            value={props.editorState?.formula || ''}
                            onChange={(e) => {
                                const newHeader = e.target.value;

                                props.setEditorState((prevEditorState => {
                                    if (prevEditorState === undefined) return undefined;
                                    return {
                                        ...prevEditorState,
                                        formula: newHeader
                                    }
                                }));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    closeColumnHeaderEditor()
                                }
                            }}
                            // We submit the column header if the user focuses outside the input
                            onBlur={() => {
                                void submitRenameColumnHeader();
                            }}
                            autoFocus
                            width='block'
                        />
                    </form>
                }
            </div>
        </div>
    )
}

export default React.memo(ColumnHeader);