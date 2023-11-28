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