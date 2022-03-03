// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import SheetTabActions from './SheetTabActions';
import MitoAPI from '../../api';
import { classNames } from '../../utils/classNames';
import Input from '../elements/Input';
import { GraphID, UIState } from '../../types';
import { focusGrid } from '../endo/focusUtils';

// import icons
import SelectedSheetTabDropdownIcon from '../icons/SelectedSheetTabDropdownIcon';
import UnselectedSheetTabDropdownIcon from '../icons/UnselectedSheetTabDropdownIcon';
import { TaskpaneInfo, TaskpaneType } from '../taskpanes/taskpanes';
import { ModalEnum } from '../modals/modals';
import GraphIcon from '../icons/GraphIcon';

type SheetTabProps = {
    tabName: string;
    tabIDObj: {tabType: 'data', selectedIndex: number} | {tabType: 'graph', graphID: GraphID}
    isSelectedTab: boolean
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI;
    mitoContainerRef: React.RefObject<HTMLDivElement>
};

/*
    Component that displays a dataframe name at the bottom of the sheet, and
    furthermore renders the sheet actions if the sheet action dropdown is 
    clicked.
*/
export default function SheetTab(props: SheetTabProps): JSX.Element {

    
    // We only set this as open if it the currOpenSheetTabActions
    const [displayActions, setDisplayActions] = useState(false);
    const [isRename, setIsRename] = useState<boolean>(false);
    const [newTabName, setNewTabName] = useState<string>(props.tabName);

    // Make sure that if we change the df name that is displayed, we default to 
    // the right new dataframe name as well
    useEffect(() => {
        setNewTabName(props.tabName);
    }, [props.tabName])
    
    const onRename = async (): Promise<void> => {
        if (props.tabIDObj.tabType === 'data') {
            await props.mitoAPI.editDataframeRename(
                props.tabIDObj.selectedIndex,
                newTabName
            );
        } else {
            await props.mitoAPI.editGraphRename(
                props.tabIDObj.graphID,
                newTabName
            )
        }
        
        setDisplayActions(false);
        setIsRename(false);

        // Focus back on the grid
        const endoGridContainer = props.mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
        focusGrid(endoGridContainer)
    }

    return (
        <div 
            className={classNames('tab', {'tab-graph': props.tabIDObj.tabType === 'graph'}, {'tab-selected': props.isSelectedTab})} 
            onClick={() => {
                props.setUIState(prevUIState => {
                    if (props.tabIDObj.tabType === 'data') {
                        // Because the graph tab is actually just a taskpane, if we're switching sheet tabs
                        // from a graph tab to a data tab, we need to close the taskpane. Otherwise, keep the taskpabe open.
                        const taskpaneInfo: TaskpaneInfo = prevUIState.currOpenTaskpane.type === TaskpaneType.GRAPH ? 
                            {type: TaskpaneType.NONE} : prevUIState.currOpenTaskpane
                        return {
                            ...prevUIState,
                            selectedTabType: 'data',
                            selectedSheetIndex: props.tabIDObj.selectedIndex,
                            currOpenTaskpane: taskpaneInfo
                        }
                    } else {
                        return {
                            ...prevUIState,
                            selectedTabType: 'graph',
                            selectedGraphID: props.tabIDObj.graphID,
                            currOpenModal: {type: ModalEnum.None},
                            currOpenTaskpane: {
                                type: TaskpaneType.GRAPH,
                                graphTaskpaneInfo: {newGraph: false, graphID: props.tabIDObj.graphID}
                            } 
                        }
                    }
                })
            }} 
            onDoubleClick={() => {setIsRename(true)}} >
            <div className='tab-content'>
                {props.tabIDObj.tabType === 'graph' &&
                    /* Put it inside a div so everything is spaced correctly */
                    <div>
                        <GraphIcon variant={props.isSelectedTab ? 'light' : 'dark'}/>
                    </div>
                }
                {isRename && 
                    <form 
                        onSubmit={async (e) => {e.preventDefault(); await onRename()}}
                        onBlur={onRename}
                    >
                        <Input 
                            value={newTabName} 
                            onChange={(e) => {setNewTabName(e.target.value)}}
                            autoFocus
                        />
                    </form>
                }
                {!isRename &&
                    <p>
                        {props.tabName} 
                    </p>
                }
                {/* Display the dropdown that allows a user to perform some action */}
                <div className='sheet-tab-dropdown-button-div' onClick={() => {setDisplayActions(true)}}>
                    {props.isSelectedTab ? <SelectedSheetTabDropdownIcon /> : <UnselectedSheetTabDropdownIcon />}
                </div>
            </div>
            {displayActions && 
                <SheetTabActions 
                    setDisplayActions={setDisplayActions}
                    setUIState={props.setUIState}
                    closeOpenEditingPopups={props.closeOpenEditingPopups}
                    setIsRename={setIsRename}
                    dfName={props.tabName}
                    tabIDObj={props.tabIDObj}
                    mitoAPI={props.mitoAPI}
                />
            }
        </div>
    );
}
