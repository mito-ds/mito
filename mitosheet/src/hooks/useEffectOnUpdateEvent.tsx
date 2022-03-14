import { useEffect } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is an update
    event sent to the backend that is processed successfully.

    This is useful for watching for undos/redos, and updating 
    parameters in interfaces to match what their current state
    is on the backend.
*/
export const useEffectOnUpdateEvent = (effect: () => void, analysisData: AnalysisData): void => {
    useEffect(() => {
        effect()
    }, [analysisData.updateEventCount])
}