import { useEffect, useRef } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is a 
    successful edit.
*/
export const useEffectOnEdit = (effect: () => void, analysisData: AnalysisData): void => { 
    const previousEditCount = useRef(0);
    useEffect(() => {
        if (analysisData.stepSummaryList.length > previousEditCount.current) {
            effect();
        }
        previousEditCount.current = analysisData.stepSummaryList.length;
    }, [analysisData.stepSummaryList.length])
}