/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';
import { MitoAPI } from '../../../api/api';
import { UIState } from '../../../types';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';

interface SuggestedVisualizationsTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}

/**
 * Sidebar shell for suggested visualizations. Content (e.g. AI-driven suggestions) can be added later.
 */
const SuggestedVisualizationsTaskpane = (props: SuggestedVisualizationsTaskpaneProps): JSX.Element => {
    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader header="Suggested Visualizations" setUIState={props.setUIState} />
            <DefaultTaskpaneBody>{null}</DefaultTaskpaneBody>
        </DefaultTaskpane>
    );
};

export default SuggestedVisualizationsTaskpane;
