import React from "react";
import { ActionEnum, GridState } from "../types";
import { Actions } from "../utils/actions";
import { isInJupyterLab } from "../utils/location";
import { useDebouncedEffect } from "./useDebouncedEffect";


const KEYBOARD_SHORTCUTS: Record<string, ActionEnum> = {
    'c': ActionEnum.Copy,
    'z': ActionEnum.Undo,
    'y': ActionEnum.Redo,
    'f': ActionEnum.OpenSearch,
}

// See comment in plugin.tsx. Because of some JupyterLab plugin issues
// we cannot detect some key press events, and thus we ignore
// some keypresses on JLab to be explicit about where things run.
// NOTE: ignoring these is not actually required, as we don't get
// these keydown events anyways, but I want to be explicit here!
const JUPYTER_LAB_SHORTCUTS_DEFINED_ELSEWHERE = ['z', 'y', 'f'];

/* 
    This effect actually does keyboard shortcuts.
*/
export const useKeyboardShortcuts = (mitoContainerRef: React.RefObject<HTMLDivElement>, actions: Actions, setGridState: React.Dispatch<React.SetStateAction<GridState>>): void => {
    // NOTE: this effect must be debounced so that we're not reregistering these event
    // listeners 100 times during every single scroll. In practice, this works perf!
    useDebouncedEffect(() => {
        const checkKeyboardShortCut = (e: KeyboardEvent) => {

            // First, we check the user is doing a keyboard shortcut
            if (!Object.keys(KEYBOARD_SHORTCUTS).includes(e.key) || (!e.ctrlKey && !e.metaKey)){
                return;
            }

            // We have a special case here if the user is doing a copy, where we need to clear
            // the previously copied values. This should always run, even if we're not in this
            // specific mito instance, because this clears the copy anyways
            if (e.key === 'c') {
                setGridState(prevGridState => {
                    return {
                        ...prevGridState,
                        copiedSelections: []
                    }
                })
            }

            // Then, check that this was actually done by a focus on this mitosheet
            if (!mitoContainerRef.current?.contains(document.activeElement)) {
                return;
            }

            // We check if the user is doing a shortcut that need not be defined on lab
            if (JUPYTER_LAB_SHORTCUTS_DEFINED_ELSEWHERE.includes(e.key) && isInJupyterLab()) {
                return;
            }

            // Then, we check if the user is actually focused on some input or textarea in Mito,
            // as in this case we don't want to overwrite this action
            if (document.activeElement?.tagName.toLowerCase() === 'input' || document.activeElement?.tagName.toLowerCase() === 'textarea') {
                return;
            }

            // If this is a copy, and the user is has some other selection on the page, we don't want to override
            // that copy, as they are most trying to copy the text they have selected
            const selectedText = window.getSelection()?.toString();
            if (e.key === 'c' && selectedText !== undefined && selectedText !== '') {
                return;
            }


            // Because JupyterLab has some other event listeners that do weird things with
            // key presses, we stop this from going elsewhere
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();

            actions.buildTimeActions[KEYBOARD_SHORTCUTS[e.key]].actionFunction();
        }
        document.addEventListener('keydown', checkKeyboardShortCut)

        return () => {document.removeEventListener('keydown', checkKeyboardShortCut)}
    }, [actions], 50)
}