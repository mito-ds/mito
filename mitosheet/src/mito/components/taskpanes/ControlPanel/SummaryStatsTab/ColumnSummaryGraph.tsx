/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { useState, useEffect } from 'react';
import { MitoAPI } from '../../../../api/api';
import { ColumnID } from '../../../../types';
import loadPlotly from '../../../../utils/plotly';

type ColumnSummaryGraphProps = {
    selectedSheetIndex: number;
    columnID: ColumnID;
    mitoAPI: MitoAPI;
}

// The response from the backend should include each of these components
export interface GraphObject {
    html: string;
    script: string;
    generation_code: string;
}


/*
    Displays the column summary graph in the column control panel
*/
function ColumnSummaryGraph(props: ColumnSummaryGraphProps): JSX.Element {
    const [graphObj, setGraphObj] = useState<GraphObject | undefined>(undefined);

    async function loadBase64PNGImage() {
        const response = await props.mitoAPI.getColumnSummaryGraph(
            props.selectedSheetIndex,
            props.columnID,
            '350px',
            '100%',
        );
        const _graphHTMLAndScript = 'error' in response ? undefined : response.result
        setGraphObj(_graphHTMLAndScript);
    }

    useEffect(() => {
        void loadBase64PNGImage();
    }, [])

    // When we get a new graph script, we execute it here. This is a workaround
    // that is required because we need to make sure this code runs, which it does
    // not when it is a script tag inside innerHtml (which react does not execute
    // for safety reasons).
    useEffect(() => {
        let isCancelled = false;

        const renderGraph = async () => {
            if (graphObj === undefined) {
                return;
            }

            const runGraphScript = () => {
                const executeScript = new Function(graphObj.script);
                executeScript();
            };

            try {
                runGraphScript();
            } catch (e) {
                const isPlotlyMissing = e instanceof Error && e.message.includes('Plotly is not defined');
                if (!isPlotlyMissing) {
                    console.error("Failed to execute graph function", e);
                    return;
                }

                try {
                    await loadPlotly();
                    if (isCancelled) {
                        return;
                    }
                    runGraphScript();
                } catch (loadError) {
                    console.error("Failed to execute graph function", loadError);
                }
            }
        };

        void renderGraph();

        return () => {
            isCancelled = true;
        };
    }, [graphObj])

    return (
        <React.Fragment>

            {graphObj !== undefined &&
                <div dangerouslySetInnerHTML={{ __html: graphObj.html }} />
            }
            {graphObj === undefined &&
                <div>
                    Loading the summary graph...
                </div>
            }
        </React.Fragment>
    );
}

export default ColumnSummaryGraph;


