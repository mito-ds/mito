// Copyright (c) Mito

import React from 'react';
import SheetTab from './SheetTab';

// import css
import "../../../css/footer.css"
import MitoAPI from '../../api';
import { TaskpaneType } from '../taskpanes/taskpanes';
import PlusIcon from '../icons/PlusIcon';
import { GridState, SheetData, UIState } from '../../types';

type FooterProps = {
    sheetDataArray: SheetData[];
    gridState: GridState;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    mitoAPI: MitoAPI;
    closeOpenEditingPopups: () => void;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
};

/*
    Wrapper component that displays the entire footer of the sheet, including
    the sheet tabs, as well as the shape of the currently selected dataframe.
*/
function Footer(props: FooterProps): JSX.Element {

    const sheetIndex = props.gridState.sheetIndex;
    const sheetData: SheetData | undefined = props.sheetDataArray[sheetIndex];

    return (
        <div className='footer'>
            <div
                className='footer-add-button'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.IMPORT}
                        }
                    })
                }}
            >
                <PlusIcon/>
            </div>
            <div className="footer-tab-bar">
                {props.sheetDataArray.map(df => df.dfName).map((dfName, idx) => {
                    return (
                        <SheetTab
                            key={idx}
                            dfName={dfName}
                            sheetIndex={idx}
                            selectedSheetIndex={sheetIndex}
                            setUIState={props.setUIState}
                            closeOpenEditingPopups={props.closeOpenEditingPopups}
                            mitoAPI={props.mitoAPI}
                            mitoContainerRef={props.mitoContainerRef}
                        />
                    )
                })}
            </div>
            {sheetData !== undefined && 
                <div className='footer-right-side'>
                    <div className='footer-sheet-shape'>
                        ({sheetData.numRows} rows, {sheetData.numColumns} cols)
                    </div>
                </div>
            }
        </div>
    );
}

export default Footer;
