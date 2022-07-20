// Copyright (c) Mito
import React, { useEffect, useState } from 'react';
import { AnalysisData, SheetData, UserProfile } from '../../types';

import LoadingIndicator from '../LoadingIndicator';
import '../../../css/elements/BottomLeftPopup.css';
import Checklist, { getRemainingChecklistItems } from '../checklists/Checklist';
import MitoAPI from '../../jupyter/api';

const BottomLeftPopup = (props: {
    analysisData: AnalysisData
    userProfile: UserProfile,
    mitoAPI: MitoAPI
    loading: [string, string | undefined, string][],
    sheetDataArray: SheetData[],
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

    const displayChecklist = getRemainingChecklistItems(props.userProfile, props.analysisData).length > 0;

    return (
        <>
            {displayLoadingIndicator && 
                <div className='bottom-left-popup-container'>
                    <LoadingIndicator loading={props.loading}/>
                </div>
            }
            {!displayLoadingIndicator && displayChecklist &&
                <div className='bottom-left-popup-container'>
                    <Checklist
                        mitoAPI={props.mitoAPI}
                        sheetDataArray={props.sheetDataArray}
                        userProfile={props.userProfile}
                        analysisData={props.analysisData}
                    />
                </div>    
            }
        </>
        
    )
}

export default BottomLeftPopup;