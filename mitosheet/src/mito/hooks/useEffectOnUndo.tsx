import { useEffect } from "react";
import { AnalysisData } from "../../types";

/* 
    This schedules an effect to run whenever there is a 
    successful undo.
*/
export const useEffectOnUndo = (effect: () => void, analysisData: AnalysisData): void => {
   
    useEffect(() => {
        if (analysisData.undoCount > 0) {
            effect();
        }        
    }, [analysisData.undoCount])
}