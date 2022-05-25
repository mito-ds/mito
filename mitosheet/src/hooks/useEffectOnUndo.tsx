import { useEffect, useRef } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is a 
    successful undo.
*/
export const useEffectOnUndo = (effect: () => void, analysisData: AnalysisData): void => {
    const numSteps = useRef(analysisData.stepSummaryList.length);
   
    useEffect(() => {
        const prevNumberSteps = numSteps.current;
        const newNumberSteps = analysisData.stepSummaryList.length;
        numSteps.current = newNumberSteps;

        if (newNumberSteps < prevNumberSteps) {
            effect();
        }        
    }, [analysisData.stepSummaryList.length])

}