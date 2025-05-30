/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useState } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is a 
    successful redo.
*/
export const useEffectOnRedo = (effect: () => void, analysisData: AnalysisData): void => {   
    const [startingRedoCount] = useState(analysisData.redoCount);
    useEffect(() => {
        if (analysisData.redoCount > startingRedoCount) {
            effect();
        }
    }, [analysisData.redoCount])

}