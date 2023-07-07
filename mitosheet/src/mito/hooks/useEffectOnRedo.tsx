import { useEffect } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is a 
    successful redo.
*/
export const useEffectOnRedo = (effect: () => void, analysisData: AnalysisData): void => {   
    useEffect(() => {
        if (analysisData.redoCount > 0) {
            effect();
        }
    }, [analysisData.redoCount])

}