// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import SheetTabActions from './SheetTabActions';
import MitoAPI from '../../api';
import { classNames } from '../../utils/classNames';
import Input from '../elements/Input';
import { UIState } from '../../types';
import { focusGrid } from '../endo/focusUtils';

// import icons
import SelectedSheetTabDropdownIcon from '../icons/SelectedSheetTabDropdownIcon';
import UnselectedSheetTabDropdownIcon from '../icons/UnselectedSheetTabDropdownIcon';

type SheetTabProps = {
    dfName: string;
    sheetIndex: number;
    selectedSheetIndex: number;
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
    const [newDataframeName, setNewDataframeName] = useState<string>(props.dfName);
    const isSelectedTab = props.selectedSheetIndex === props.sheetIndex
    const selectedClass = isSelectedTab ? 'tab-selected' : '';

    // Make sure that if we change the df name that is displayed, we default to 
    // the right new dataframe name as well
    useEffect(() => {
        setNewDataframeName(props.dfName);
    }, [props.dfName])
    
    const onRename = async (): Promise<void> => {
        await props.mitoAPI.editDataframeRename(
            props.sheetIndex,
            newDataframeName
        );

        setDisplayActions(false);
        setIsRename(false);

        // Focus back on the grid
        const endoGridContainer = props.mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
        focusGrid(endoGridContainer)
    }

    return (
        <div 
            className={classNames('tab', selectedClass)} 
            onClick={() => {
                props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        selectedSheetIndex: props.sheetIndex
                    }
                })
            }} 
            onDoubleClick={() => {setIsRename(true)}} >
            <div className='tab-content'>
                {isRename && 
                    <form 
                        onSubmit={async (e) => {e.preventDefault(); await onRename()}}
                        onBlur={onRename}
                    >
                        <Input 
                            value={newDataframeName} 
                            onChange={(e) => {setNewDataframeName(e.target.value)}}
                            autoFocus
                        />
                    </form>
                }
                {!isRename &&
                    <p className='tab-sheet-name'>
                        {props.dfName} 
                    </p>
                }
                {/* Display the dropdown that allows a user to perform some action */}
                <div className='sheet-tab-dropdown-button-div' onClick={() => {setDisplayActions(true)}}>
                    {isSelectedTab ? <SelectedSheetTabDropdownIcon /> : <UnselectedSheetTabDropdownIcon />}
                </div>
            </div>
            {displayActions && 
                <SheetTabActions 
                    setDisplayActions={setDisplayActions}
                    setUIState={props.setUIState}
                    closeOpenEditingPopups={props.closeOpenEditingPopups}
                    setIsRename={setIsRename}
                    dfName={props.dfName}
                    selectedSheetIndex={props.selectedSheetIndex}
                    sheetIndex={props.sheetIndex} 
                    mitoAPI={props.mitoAPI}
                />
            }
        </div>
    );
}
