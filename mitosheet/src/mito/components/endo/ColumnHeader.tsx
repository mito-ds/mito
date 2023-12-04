import React from 'react';
import { FilterIcon } from '../icons/FilterIcons';
import '../../../../css/endo/ColumnHeaders.css';
import { DEFAULT_BORDER_STYLE, getBorderStyle, getIsCellSelected, getColumnIndexesInSelections} from './selectionUtils';
import { EditorState, GridState, SheetData, UIState } from '../../types';
import { getCellDataFromCellIndexes, getTypeIdentifier } from './utils';
import { MitoAPI } from '../../api/api';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { classNames } from '../../utils/classNames';
import Input from '../elements/Input';
import { focusGrid } from './focusUtils';
import { getColumnHeaderParts, getDisplayColumnHeader } from '../../utils/columnHeaders';
import { DEFAULT_HEIGHT } from './EndoGrid';
import { ControlPanelTab } from '../taskpanes/ControlPanel/ControlPanelTaskpane'
import { submitRenameColumnHeader } from './columnHeaderUtils';
import ColumnHeaderDropdown from './ColumnHeaderDropdown';
import { getWidthArrayAtFullWidthForColumnIndexes } from './widthUtils';
import { reconIsColumnCreated, reconIsColumnRenamed } from '../taskpanes/AITransformation/aiUtils';
import { Actions } from '../../utils/actions';

export const HEADER_TEXT_COLOR_DEFAULT = 'var(--mito-text)'
export const HEADER_BACKGROUND_COLOR_DEFAULT = 'var(--mito-background-highlight)';

export const CREATED_RECON_COLOR = '#E4EFDC' // This is var(--mito-recon-created-background-color) - update this if we change this variable
export const MODIFIED_RECON_COLOR = '#FDF3D0' // This is var(--mito-recon-modified-background-color) - update this if we change this variable

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
    setGridState: React.Dispatch<React.SetStateAction<GridState>>
    sheetData: SheetData,
    editorState: EditorState | undefined;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    columnIndex: number,
    containerRef: React.RefObject<HTMLDivElement>;
    columnHeaderOperation: 'reorder' | 'resize' | undefined;
    setColumnHeaderOperation: React.Dispatch<React.SetStateAction<'reorder' | 'resize' | undefined>>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
    actions: Actions;
}): JSX.Element => {

    const selected = getIsCellSelected(props.gridState.selections, -1, props.columnIndex);
    const width = props.gridState.widthDataArray[props.gridState.sheetIndex].widthArray[props.columnIndex];
    const { columnID, columnFilters, columnHeader, columnDtype, headerBackgroundColor, headerTextColor } = getCellDataFromCellIndexes(props.sheetData, -1, props.columnIndex);

    if (columnID === undefined || columnFilters === undefined || columnDtype == undefined || columnHeader === undefined) {
        return <></>
    }

    const hasFilters = columnFilters.filters.length > 0;
    const editingColumnHeader = props.editorState !== undefined && props.editorState.editorLocation === 'cell' && props.editorState.rowIndex <= -1 && props.editorState.columnIndex === props.columnIndex;
    const editingFinalColumnHeader = props.editorState !== undefined && props.editorState.editorLocation === 'cell' && props.editorState.rowIndex === -1 && props.editorState.columnIndex === props.columnIndex;


    // Get the pieces of the column header. If the column header is not a MultiIndex header, then
    // lowerLevelColumnHeaders will be an empty array
    const { lowerLevelColumnHeaders, finalColumnHeader } = getColumnHeaderParts(columnHeader);

    // Check if the column header is a match of the search
    const matchesSearch = props.uiState.currOpenSearch.matches.find((value) => {
        return value.rowIndex === -1 && value.colIndex === props.columnIndex;
    }) !== undefined;

    // Check if the current match is this column header. If so, highlight it. 
    const borderStyle = getBorderStyle(props.gridState.selections, props.gridState.copiedSelections, -1, props.columnIndex, props.sheetData.numRows, matchesSearch, props.uiState.highlightedColumnIndex);

    const openColumnHeaderEditor = () => {
        props.setEditorState({
            rowIndex: -1,
            columnIndex: props.columnIndex,
            formula: getDisplayColumnHeader(finalColumnHeader),
            editorLocation: 'cell',
            editingMode: 'specific_index_labels',
            sheetIndex: props.gridState.sheetIndex,
        })
    }

    const closeColumnHeaderEditor = () => {
        props.setEditorState(undefined);
        // We then focus on the grid, as we are no longer focused on the editor
        setTimeout(() => focusGrid(props.containerRef.current), 100);
    }

    const ColumnHeaderResizer = (
        <div
            className='endo-column-header-resizer'
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
            onMouseDown={(e) => {
                // Prevent the onMouseDown event in EndoGrid.tsx from resetting the selected indexes
                e.stopPropagation();
            }}
            onMouseUp={(e) => {
                // Prevent the onMouseUp event in EndoGrid.tsx from resetting the selected indexes
                e.stopPropagation();
            }}
            onClick={(e) => {
                // Prevent the onClick event in ColumnHeader from opening the column control panel
                e.stopPropagation();
            }}
            draggable="true"
            onDoubleClick={() => {
                // First make sure this column header is part of the selection
                const selectionsCopy = [...props.gridState.selections]
                const isColumnSelected = getIsCellSelected(selectionsCopy, -1, props.columnIndex)
                if (!isColumnSelected) {
                    selectionsCopy.push({
                        startingRowIndex: -1,
                        endingRowIndex: -1,
                        startingColumnIndex: props.columnIndex,
                        endingColumnIndex: props.columnIndex,
                        sheetIndex: props.gridState.sheetIndex,
                    })
                }

                const columnIndexes = getColumnIndexesInSelections(selectionsCopy)
                // Then set the full column width of all the selected columns
                const widthData = getWidthArrayAtFullWidthForColumnIndexes(columnIndexes, props.gridState, props.sheetData)

                props.setGridState(prevGridState => {
                    return {
                        ...prevGridState,
                        selections: selectionsCopy,
                        widthDataArray: widthData
                    }
                })
            }}
        />
    )

    //If there is a dataRecon set, highlight the column headers that have been created or renamed
    const isColumnCreated = reconIsColumnCreated(columnHeader, props.uiState.dataRecon, props.sheetData)
    const isColumnRenamed = reconIsColumnRenamed(columnHeader, props.uiState.dataRecon, props.sheetData)

    // Give priority to the recon colors, then formatting colors, then default colors
    const backgroundColor = isColumnCreated ? CREATED_RECON_COLOR : isColumnRenamed ? MODIFIED_RECON_COLOR : headerBackgroundColor || HEADER_BACKGROUND_COLOR_DEFAULT;
    const textColor = isColumnCreated || isColumnRenamed ? 'var(--mito-recon-text-color)' : headerTextColor || HEADER_TEXT_COLOR_DEFAULT;
    
    return (
        <div
            className={classNames(
                'endo-column-header-container',
                'endo-column-header-text',
                {
                    'endo-column-header-container-selected': selected,
                    'recon': isColumnCreated || isColumnRenamed,
                },
            )}
            style={{color: textColor, backgroundColor: backgroundColor}}
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
                props.setUIState({...props.uiState, highlightedColumnIndex: undefined})
            }}
            title={getDisplayColumnHeader(columnHeader)}
            // We have to make it not draggable when we're editing the column header,
            // so that you can click within the input to move around. This is a FF bug
            // see here: https://newbedev.com/prevent-drag-event-to-interfere-with-input-elements-in-firefox-using-html5-drag-drop
            draggable={!editingColumnHeader ? 'true' : 'false'}
            onContextMenu={(e) => {
                e.preventDefault()
                props.setUIState((prevUiState) => {
                    return {
                        ...prevUiState,
                        currOpenDropdown: {
                            row: -1,
                            column: props.columnIndex
                        }
                    }
                });
            }}
        >
            {lowerLevelColumnHeaders.map((lowerLevelColumnHeader, levelIndex) => {
                // For each lower-level column header, we display them with a row index
                // counting up to -1, which is the highest level column header
                const rowIndex = -1 - (lowerLevelColumnHeaders.length - levelIndex);
                const editingLowerLevelColumnHeader = props.editorState !== undefined && props.editorState.rowIndex === rowIndex && props.editorState.columnIndex === props.columnIndex;

                return (
                    <div
                        className='endo-column-header-lower-level-container'
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
                                className='endo-column-header-lower-level-text text-overflow-hide'
                                style={{
                                    maxWidth: `${width - 25}px`, // Make sure it doesn't overflow
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation(); // stop prop, so we don't call the onclick the header container
                                    props.setEditorState({
                                        rowIndex: rowIndex,
                                        columnIndex: props.columnIndex,
                                        formula: getDisplayColumnHeader(lowerLevelColumnHeader),
                                        editorLocation: 'cell',
                                        editingMode: 'specific_index_labels',
                                        sheetIndex: props.gridState.sheetIndex,
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
                className={classNames('endo-column-header-final-container', {
                    'endo-grabbable': props.columnHeaderOperation === 'reorder', // Only display as endo-grabbable when we're not resizing a column
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
                            className='endo-column-header-final-text'
                            onClick={(e) => {
                                e.stopPropagation(); // Stop prop, so we don't call the onclick the header container
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation(); // Stop prop, so we don't call the onclick the header container
                                props.setEditorState({
                                    rowIndex: -1,
                                    columnIndex: props.columnIndex,
                                    formula: getDisplayColumnHeader(finalColumnHeader),
                                    editorLocation: 'cell',
                                    editingMode: 'specific_index_labels',
                                    sheetIndex: props.gridState.sheetIndex,
                                })
                            }}
                            key={props.columnIndex}
                            tabIndex={-1}
                        >
                            {/* Only display the final column header in this final section */}
                            {finalColumnHeader + ''}
                        </div>

                        <div className='endo-column-header-final-right-side' >
                            <div className='endo-column-header-final-icons' title='Open the column control panel' >
                                <span title='Edit filters'>
                                    {!hasFilters &&
                                        <FilterIcon />
                                    }
                                    {hasFilters &&
                                        <FilterIcon nonEmpty />
                                    }
                                </span>
                                <div className='text-body-2 text-color-highlight-important-on-hover' style={{color: textColor}}>
                                    {getTypeIdentifier(columnDtype)}
                                </div>

                            </div>
                            {ColumnHeaderResizer}
                        </div>
                    </>
                }
                {editingFinalColumnHeader &&
                    <form
                        className='element-width-block'
                        onSubmit={() => {
                            submitRenameColumnHeader(columnHeader, finalColumnHeader, columnID, props.gridState.sheetIndex, props.editorState, props.setUIState, props.mitoAPI)
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
                            // We submit the column header if the user focuses outside the input
                            onBlur={() => {
                                void submitRenameColumnHeader(columnHeader, finalColumnHeader, columnID, props.gridState.sheetIndex, props.editorState, props.setUIState, props.mitoAPI);
                                closeColumnHeaderEditor()
                            }}
                            autoFocus
                            width='block'
                        />
                    </form>
                }
            </div>
            <ColumnHeaderDropdown
                mitoAPI={props.mitoAPI}
                column={props.columnIndex}
                uiState={props.uiState}
                setUIState={props.setUIState}
                openColumnHeaderEditor={openColumnHeaderEditor}
                sheetIndex={props.gridState.sheetIndex}
                columnID={columnID}
                columnDtype={columnDtype}
                closeOpenEditingPopups={props.closeOpenEditingPopups} 
                setEditorState={props.setEditorState}
                sheetData={props.sheetData}
                gridState={props.gridState}
                actions={props.actions}
            />
        </div>
    )
}

export default React.memo(ColumnHeader);

