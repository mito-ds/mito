/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';
import { classNames } from '../../../utils/classNames';
import { UIState } from '../../../types';

import { ControlPanelTab } from './ControlPanelTaskpane';
import { MitoAPI } from '../../../api/api';

/* 
    The tabs at the bottom of the column control panel that allows users to switch
    from sort/filter to seeing summary statistics about the column
*/
function ControlPanelTaskpaneTabs(
    props: {
        selectedTab: ControlPanelTab, 
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI;
    }): JSX.Element {

    const changeTab = (tab: ControlPanelTab) => {
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                selectedColumnControlPanelTab: tab
            }
        })

        // Send a log message saying that this tab has been clicked,
        // and keeping the tab at the highest level
        void props.mitoAPI.log('clicked_' + tab + '_tab');
    }

    return (
        <div className='control-panel-taskpane-tab-container'>
            <div 
                className={classNames('control-panel-taskpane-tab', props.selectedTab === ControlPanelTab.FilterSort ? 'selected' : 'unselected')} 
                onClick={() => changeTab(ControlPanelTab.FilterSort)}
            >
                <p>
                    Filter/Sort
                </p>
            </div>
            <div 
                className={classNames('control-panel-taskpane-tab', props.selectedTab === ControlPanelTab.UniqueValues ? 'selected' : 'unselected')} 
                onClick={() => changeTab(ControlPanelTab.UniqueValues)}
            >
                <p>
                    Values
                </p>
            </div>
            <div 
                className={classNames('control-panel-taskpane-tab', props.selectedTab === ControlPanelTab.SummaryStats ? 'selected' : 'unselected')} 
                onClick={() => changeTab(ControlPanelTab.SummaryStats)}
            >
                <p>
                    Stats
                </p>
            </div>
        </div> 
    )
} 

export default ControlPanelTaskpaneTabs;