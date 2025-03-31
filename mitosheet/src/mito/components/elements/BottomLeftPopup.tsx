/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
import React, { useEffect, useState } from 'react';
import { AnalysisData, SheetData, UIState, UserProfile } from '../../types';

import '../../../../css/elements/BottomLeftPopup.css';
import { MitoAPI } from '../../api/api';
import { Actions } from '../../utils/actions';
import LoadingIndicator from '../LoadingIndicator';
import { ModalInfo } from '../modals/modals';

const BottomLeftPopup = (props: {
    analysisData: AnalysisData
    userProfile: UserProfile,
    mitoAPI: MitoAPI
    loading: [string, string | undefined, string][],
    sheetDataArray: SheetData[],
    currOpenModal: ModalInfo,
    actions: Actions
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
}): JSX.Element => {
    // We only display the loading indicator after .5 seconds, and we track
    // it in the popup component so that we can display something else if
    // the loading indicator is not there
    const [displayLoadingIndicator, setDisplayLoadingIndicator] = useState(false);

    // This makes sure we're only displaying after .5 seconds of loading
    useEffect(() => {
        if (props.loading.length === 0) {
            setDisplayLoadingIndicator(false);
        } else if (props.loading.length > 0) {
            const timeout = setTimeout(() => {
                setDisplayLoadingIndicator(true);
            }, 500);
            return () => {clearTimeout(timeout)}
        }
    }, [props.loading.length]);

    return (
        <>
            {displayLoadingIndicator && 
                <div className='bottom-left-popup-container'>
                    <LoadingIndicator loading={props.loading}/>
                </div>
            }
        </>
    )
}

export default BottomLeftPopup;