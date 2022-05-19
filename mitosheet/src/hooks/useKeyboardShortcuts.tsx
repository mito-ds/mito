import { isInJupyterLab } from "../jupyter/jupyterUtils";
import { Action, ActionEnum } from "../types";
import { useDebouncedEffect } from "./useDebouncedEffect";


const KEYBOARD_SHORTCUTS: Record<string, ActionEnum> = {
    'c': ActionEnum.Copy,
    'z': ActionEnum.Undo,
    'y': ActionEnum.Redo,
}

const LAB_SHORTCUTS_DEFINED_ELSEWHERE = ['z', 'y'];

/* 
    
*/
export const useKeyboardShortcuts = (mitoContainerRef: React.RefObject<HTMLDivElement>, actions: Record<ActionEnum, Action>): void => {
    // NOTE: this effect must be debounced so that we're not reregistering these event
    // listeners 100 times during every single scroll. In practice, this works perf!
    useDebouncedEffect(() => {
        const checkKeyboardShortCut = (e: KeyboardEvent) => {

            // First, check that this was actually done by a focus on this mitosheet
            if (!mitoContainerRef.current?.contains(document.activeElement)) {
                return;
            }

            // Then, we check the user is doing a keyboard shortcut
            if (!Object.keys(KEYBOARD_SHORTCUTS).includes(e.key) || (!e.ctrlKey && !e.metaKey)){
                return;
            }

            // We check if the user is doing a shortcut that need not be defined on lab
            if (LAB_SHORTCUTS_DEFINED_ELSEWHERE.includes(e.key) && isInJupyterLab()) {
                return;
            }

            // Then, we check if the user is actually focused on some input in Mito,
            // as in this case we don't want to overwrite this action
            if (document.activeElement?.tagName.toLowerCase() === 'input') {
                return;
            }

            // Because JupyterLab has some other event listeners that do weird things with
            // key presses, we stop this from going elsewhere
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();

            actions[KEYBOARD_SHORTCUTS[e.key]].actionFunction();
        }
        document.addEventListener('keydown', checkKeyboardShortCut)

        return () => {document.removeEventListener('keydown', checkKeyboardShortCut)}
    }, [actions], 50)
}