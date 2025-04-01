/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useState } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is an update
    event sent to the backend that is processed successfully.

    This is useful for watching for undos/redos, and updating 
    parameters in interfaces to match what their current state
    is on the backend.

    Note that this hook will by not run on first render.
*/
export const useEffectOnUpdateEvent = (effect: () => void, analysisData: AnalysisData): void => {
    const [firstRender, setFirstRender] = useState(true);
    useEffect(() => {
        if (firstRender) {
            setFirstRender(false);
            return;
        }

        effect()
    }, [analysisData.updateEventCount])
}