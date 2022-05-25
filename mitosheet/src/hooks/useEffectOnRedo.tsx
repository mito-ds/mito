import { useEffect, useRef } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is a 
    successful redo.
*/
export const useEffectOnRedo = (effect: () => void, analysisData: AnalysisData): void => {
    const numSteps = useRef(analysisData.stepSummaryList.length);
    const updateEventCount = useRef(analysisData.updateEventCount);
   
    useEffect(() => {
        const prevNumberSteps = numSteps.current;
        const newNumberSteps = analysisData.stepSummaryList.length;
        numSteps.current = newNumberSteps;

        const prevUpdateEventCount = updateEventCount.current;
        const newUpdateEventCount = analysisData.updateEventCount;
        updateEventCount.current = newUpdateEventCount;

        if (newNumberSteps > prevNumberSteps && prevUpdateEventCount < newUpdateEventCount) {
            effect();
        }
    }, [analysisData.stepSummaryList.length])

}