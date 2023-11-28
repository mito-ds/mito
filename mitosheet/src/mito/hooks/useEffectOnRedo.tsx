import { useEffect, useRef } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is a 
    successful redo.
*/
export const useEffectOnRedo = (effect: () => void, analysisData: AnalysisData): void => {   
    const redoCountRef = useRef(analysisData.redoCount);
    useEffect(() => {
        if (analysisData.redoCount > redoCountRef.current) {
            redoCountRef.current = analysisData.redoCount;
            effect();
        }
    }, [analysisData.redoCount])

}