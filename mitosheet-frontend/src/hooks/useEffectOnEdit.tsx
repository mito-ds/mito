import { useEffect, useState } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is a 
    successful edit.
*/
export const useEffectOnEdit = (effect: () => void, analysisData: AnalysisData): void => { 
    const [previousEditCount, setPreviousEditCount] = useState(() => analysisData.stepSummaryList.length);
    useEffect(() => {
        if (analysisData.stepSummaryList.length > previousEditCount) {
            effect();
        }
        setPreviousEditCount(analysisData.stepSummaryList.length);
    }, [analysisData.stepSummaryList.length])
}