// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import { MitoAPI } from '../../api/api';
import { DFSource, GraphDataArray, GraphID, SheetData, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { ModalEnum } from '../modals/modals';
import { TaskpaneType } from '../taskpanes/taskpanes';

/*
    Helper function for finding all of the graph tab names
    that are created from a given sheet index
*/
export const getGraphTabNamesAndIDsFromSheetIndex = (sheetIndex: number, graphDataArray: GraphDataArray): ({graphTabName: string, graphID: GraphID})[] => {
    return Object.entries(graphDataArray).map(([graphID, graphData]) => {
        return {graphTabName: graphData.graph_tab_name, graphID: graphID}
    })
} 

/*
    Displays a set of actions one can perform on a data sheet tab, including
    deleting, duplicating, or renaming, and creating a sheet.
*/
export default function SheetTabContextMenu(props: {
    setDisplayContextMenu: (display: boolean) => void;
    setIsRename: React.Dispatch<React.SetStateAction<boolean>>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI
    sheetIndex: number
    graphDataArray: GraphDataArray
    sheetDataArray: SheetData[]
    display: boolean
}): JSX.Element {

    const imported = props.sheetDataArray[props.sheetIndex]?.dfSource === DFSource.Imported;
    const pivoted = props.sheetDataArray[props.sheetIndex]?.dfSource === DFSource.Pivoted;

    // Log opening the data sheet tab actions
    useEffect(() => {
        if (props.display) {
            void props.mitoAPI.log(
                'clicked_data_sheet_tab_actions',
                {
                    sheet_index: props.sheetIndex
                }
            )
        }
    }, [props.display])

    const onDelete = async (): Promise<void> => {
        const dependantGraphTabNamesAndIDs = getGraphTabNamesAndIDsFromSheetIndex(props.sheetIndex, props.graphDataArray)
        
        if (dependantGraphTabNamesAndIDs.length > 0) {
            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenModal: {
                        type: ModalEnum.DeleteGraphs, 
                        dependantGraphTabNamesAndIDs: dependantGraphTabNamesAndIDs,
                        sheetIndex: props.sheetIndex
                    }
                }
            })
        } else {
            // Select the previous sheet
            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    selectedTabType: 'data',
                    selectedSheetIndex: prevUIState.selectedSheetIndex > 0 ? prevUIState.selectedSheetIndex - 1 : 0,
                }
            })

            // Close 
            props.closeOpenEditingPopups();

            await props.mitoAPI.editDataframeDelete(props.sheetIndex)
        }
    }

    const onDuplicate = async (): Promise<void> => {
        props.closeOpenEditingPopups();
        await props.mitoAPI.editDataframeDuplicate(props.sheetIndex)
    }

    /* Rename helper, which requires changes to the sheet tab itself */
    const onRename = (): void => {
        props.setIsRename(true);
    }
    
    const openDownloadTaskpane = async (): Promise<void> => {
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.DOWNLOAD},
                currOpenModal: {type: ModalEnum.None},
            }
        })
    }

    const dfSource = props.sheetDataArray[props.sheetIndex].dfSource;

    const dropdownItems: JSX.Element[] = [
        <DropdownItem
            key='Create graph'
            title='Create graph'
            onClick={(e) => {
                // Stop propogation so that the onClick of the sheet tab div
                // doesn't compete updating the uiState to this sheet instead of
                // the new graphID that we're creating
                e?.stopPropagation()
            }}
        />,
        <DropdownItem 
            key='Export'
            title='Export'
            onClick={openDownloadTaskpane}
        />,
        pivoted ? <DropdownItem key='Edit Pivot' title='Edit Pivot' onClick={async () => {
            const response = await props.mitoAPI.getPivotParams(props.sheetIndex);
            const existingPivotParams = 'error' in response ? undefined : response.result;

            if (existingPivotParams !== undefined) {
                props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {
                            type: TaskpaneType.PIVOT,
                            sourceSheetIndex: existingPivotParams.sheet_index,
                            destinationSheetIndex: prevUIState.selectedSheetIndex,
                            existingPivotParams: existingPivotParams
                        },
                        selectedTabType: 'data'
                    }
                })
            }
        }}/> : undefined,
        // if this dataframe is imported, then allow the user to change the import
        imported ? <DropdownItem key='Change Import' title='Change Import' onClick={() => {
            props.closeOpenEditingPopups();
            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenTaskpane: {
                        type: TaskpaneType.UPDATEIMPORTS
                    }
                }
            })
        }}/> : undefined,
        dfSource === DFSource.Merged ? 
            (<DropdownItem
                key={'Edit Merge'}
                title={'Edit Merge'}
                onClick={async () => {
                    props.closeOpenEditingPopups();
                    const response = await props.mitoAPI.getMergeParams(props.sheetIndex);
                    const existingMergeParams = 'error' in response ? undefined : response.result;
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {
                                type: TaskpaneType.MERGE,
                                existingParams: existingMergeParams,
                            }
                        }
                    })
                }}
            />)
            : undefined,
        <DropdownSectionSeperator key='sep' isDropdownSectionSeperator={true} />,
        <DropdownItem 
            key='Duplicate'
            title='Duplicate'
            onClick={onDuplicate}
        />,
        <DropdownItem 
            key='Rename'
            title='Rename'
            onClick={onRename}
            supressFocusSettingOnClose
        />,
        <DropdownItem 
            key='Delete'
            title='Delete'
            onClick={(e) => {
                // Stop propogation so that the onClick of the sheet tab div
                // doesn't compete updating the uiState to the graphID that is gettind deleted
                e?.stopPropagation()
                void onDelete()
            }}
        />
    ].filter(element => element !== null && element !== undefined) as JSX.Element[];

    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => {
                props.setUIState((prevUIState) => {
                    // If the dropdown is open, then close it. Otherwise, don't change the state. 
                    const display = typeof prevUIState.currOpenDropdown === 'object' && prevUIState.currOpenDropdown.type === 'footer-context-menu' && prevUIState.currOpenDropdown.sheetIndex === props.sheetIndex;
                    return {
                        ...prevUIState,
                        currOpenDropdown: display ? undefined : prevUIState.currOpenDropdown
                    }
                });
            }}
            width='medium'
        >
            {dropdownItems}
        </Dropdown>
    )
}

