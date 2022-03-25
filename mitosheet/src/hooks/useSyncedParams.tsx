import React, { useCallback, useEffect, useState } from "react";
import MitoAPI from "../api";
import { AnalysisData } from "../types";
import { useEffectOnUpdateEvent } from "./useEffectOnUpdateEvent";

/* 
    TODO:
    1. Allows you to create default params
    2. Allows those params to refresh on undo/redo
    3. Automatically sends messages when params are updated
*/
function useSyncedParams<T>(
    defaultParams: T,
    stepType: string,
    editEventType: string,
    mitoAPI: MitoAPI,
    analysisData: AnalysisData
): [T, React.Dispatch<React.SetStateAction<T>>] {

    const [params, _setParams] = useState(defaultParams);
    const [updateNumber, setUpdateNumber] = useState(0);
    const [stepID, setStepID] = useState<string | undefined>(undefined);

    useEffect(() => {
        onChange()
    }, [updateNumber])

    useEffectOnUpdateEvent(() => {
        void refreshParams();
    }, analysisData)

    // TODO: explain this !
    const setParams: React.Dispatch<React.SetStateAction<T>> = useCallback(
        (args: any) => {
            _setParams(args);
            setUpdateNumber(old => old + 1)
        },
        [],
    );

    const onChange = async () => {
        const _stepID = await mitoAPI._edit(editEventType, params, stepID);
        setStepID(_stepID);
    }

    const refreshParams = async (): Promise<void> => {
        if (stepID === undefined) {
            _setParams(defaultParams);
            return;
        }

        const newParams = await mitoAPI.getParams<typeof defaultParams>('concat', stepID, {});
        if (newParams !== undefined) {
            _setParams(newParams);
        } else {
            _setParams(defaultParams);
        }
    }

    return [params, setParams];
}

export default useSyncedParams;