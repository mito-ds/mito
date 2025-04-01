/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { useState, useEffect } from 'react';
import { MitoAPI } from '../../../../api/api';
import { ColumnID } from '../../../../types';

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
        if (graphObj === undefined) {
            return;
        }
        try {
            const executeScript = new Function(graphObj.script);
            executeScript()
        } catch (e) {
            console.error("Failed to execute graph function", e)
        }

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


