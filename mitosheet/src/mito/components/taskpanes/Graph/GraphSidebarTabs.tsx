// Copyright (c) Mito

import React from 'react';
import { classNames } from '../../../utils/classNames';
import { GraphSidebarTab } from '../../../types';
import { MitoAPI } from '../../../api/api';

/* 
    The tabs at the bottom of the graph sidebar that let you switch between
    setup, style, and export
*/
function GraphSidebarTabs(
    props: {
        selectedTab: GraphSidebarTab, 
        setSelectedGraphSidebarTab: (tab: GraphSidebarTab) => void,
        mitoAPI: MitoAPI;
    }): JSX.Element {

    const changeTab = (tab: GraphSidebarTab) => {
        props.setSelectedGraphSidebarTab(tab)

        // Send a log message saying that this tab has been clicked,
        // and keeping the tab at the highest level
        void props.mitoAPI.log('clicked_graph_' + tab + '_tab');
    }

    return (
        <div className='graph-sidebar-tab-container'>
            <div 
                className={classNames('control-panel-taskpane-tab', props.selectedTab === GraphSidebarTab.Setup ? 'selected' : 'unselected')} 
                onClick={() => changeTab(GraphSidebarTab.Setup)}
            >
                <p>
                    Setup
                </p>
            </div>
            <div 
                className={classNames('control-panel-taskpane-tab', props.selectedTab === GraphSidebarTab.Style ? 'selected' : 'unselected')} 
                onClick={() => changeTab(GraphSidebarTab.Style)}
            >
                <p>
                    Style
                </p>
            </div>
            <div 
                className={classNames('control-panel-taskpane-tab', props.selectedTab === GraphSidebarTab.Export ? 'selected' : 'unselected')} 
                onClick={() => changeTab(GraphSidebarTab.Export)}
            >
                <p>
                    Export
                </p>
            </div>
        </div> 
    )
} 

export default GraphSidebarTabs;