import { useEffect } from "react";
import { AnalysisData } from "../types";

/* 
    TODO: explainn this! it is for undo or redo

    TODO: do we want to allow other dependencies? I think no!

    TODO: note that it 
*/
export const useEffectOnUpdate = (effect: () => void, analysisData: AnalysisData): void => {
    useEffect(() => {
        effect()
    }, [analysisData.updateEventCount])
}