// Copyright (c) Mito
import React, { useEffect, useState } from 'react';
import { AnalysisData, SheetData, UserProfile } from '../../types';

import LoadingIndicator from '../LoadingIndicator';
import '../../../css/elements/BottomLeftPopup.css';
import Checklist, { getRemainingChecklistItems } from '../checklists/Checklist';
import MitoAPI from '../../jupyter/api';
import { isVariantA } from '../../utils/experiments';
import { ModalEnum, ModalInfo } from '../modals/modals';

const BottomLeftPopup = (props: {
    analysisData: AnalysisData
    userProfile: UserProfile,
    mitoAPI: MitoAPI
    loading: [string, string | undefined, string][],
    sheetDataArray: SheetData[],
    currOpenModal: ModalInfo
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

    // We only display the checklist if we are in variant a
    const displayChecklist = isVariantA(props.analysisData) 
        && getRemainingChecklistItems(props.userProfile).length > 0
        && props.currOpenModal.type !== ModalEnum.SignUp;

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