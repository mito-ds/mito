/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { ActivationFunction } from 'vscode-notebook-renderer';

export const activate: ActivationFunction = (context) => {
    return {
        renderOutputItem(outputItem, element) {
            // Hide this output — it's only here to pass metadata to the extension host
            element.style.display = 'none';

            const data = outputItem.json() as { port: number; session_id: string };

            context.postMessage?.({
                type: 'mito:register',
                port: data.port,
                sessionId: data.session_id,
            });
        },

        disposeOutputItem() {
            // Nothing to clean up on the renderer side;
            // the extension host detects server death via polling errors
        },
    };
};
