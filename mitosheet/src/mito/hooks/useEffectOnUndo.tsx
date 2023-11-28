import { useEffect, useRef } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is a 
    successful undo.
*/
export const useEffectOnUndo = (effect: () => void, analysisData: AnalysisData): void => {
    
    const undoCountRef = useRef(analysisData.undoCount);
    useEffect(() => {
        
        if (analysisData.undoCount > undoCountRef.current) {
            undoCountRef.current = analysisData.undoCount;
            effect();
        }        
        
    }, [analysisData.undoCount])
}