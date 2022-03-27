import React, { useCallback, useEffect, useState } from "react";
import MitoAPI from "../api";
import { AnalysisData } from "../types";
import { useEffectOnUpdateEvent } from "./useEffectOnUpdateEvent";

/* 
    This is the first really cool custom hook. Generally, it allows you 
    to take some UI element and syncronize the parameters it has for an
    edit event to the backend. 

    If you pass this event default parameters, the stepType you are creating,
    and the edit event to create that step type, then this hook will:

    1. Give you access to [param, setParam] state setters.
    2. Automatically watch for undo/redo, and refresh params in that case.
    3. Send messages when the params are updated (ignoring undo/redo updates)

    See ConcatTaskpane for how this is used. In generally, it allows us to
    take the custom UI code we have to write down to _just_ the code to display
    the parameters to the user and allow them to edit them. This is really
    sweet, and we'll continue to migrate to this hook over time. Woo!
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
        void onChange()
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

        const newParams = await mitoAPI.getParams<typeof defaultParams>(stepType, stepID, {});
        if (newParams !== undefined) {
            _setParams(newParams);
        } else {
            _setParams(defaultParams);
        }
    }

    return [params, setParams];
}

export default useSyncedParams;