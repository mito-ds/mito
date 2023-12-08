import { ActionEnum, KeyboardShorcut } from "../types"
import { Actions } from "./actions"

/**
 * A list of all keyboard shortcuts in the app.
 */
export const keyboardShortcuts: KeyboardShorcut[] = [
    {
        macKeyCombo: {
            metaKey: true,
            key: ['c']
        },
        winKeyCombo: {
            ctrlKey: true,
            key: ['c']
        },
        action: ActionEnum.Copy
    },
    {
        macKeyCombo: {
            metaKey: true,
            key: ['f']
        },
        winKeyCombo: {
            ctrlKey: true,
            key: ['f']
        },
        preventDefaultAndStopPropagation: true,
        jupyterLabAction: 'mitosheet:open-search',
        action: ActionEnum.OpenSearch
    },
    {
        macKeyCombo: {
            metaKey: true,
            key: ['z']
        },
        winKeyCombo: {
            ctrlKey: true,
            key: ['z']
        },
        jupyterLabAction: 'mitosheet:mito-undo',
        action: ActionEnum.Undo
    },
    {
        macKeyCombo: {
            metaKey: true,
            key: ['y']
        },
        winKeyCombo: {
            ctrlKey: true,
            key: ['y']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.Redo
    },
    {
        macKeyCombo: {
            altKey: true,
            key: ['ArrowLeft']
        },
        winKeyCombo: {
            altKey: true,
            // TODO: this  is not consistent with the Excel shortcut in windows. 
            // But Edge grabs focus when pressing ctrl+PageUp/PageDown (which is the Excel shortcut)
            key: ['ArrowLeft']
        },
        action: ActionEnum.Open_Previous_Sheet
    },
    {
        macKeyCombo: {
            altKey: true,
            key: ['ArrowRight']
        },
        winKeyCombo: {
            altKey: true,
            // TODO: this  is not consistent with the Excel shortcut in windows. 
            // But Edge grabs focus when pressing ctrl+PageUp/PageDown (which is the Excel shortcut)
            key: ['ArrowRight']
        },
        action: ActionEnum.Open_Next_Sheet
    },
    {
        macKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            key: ['F']
        },
        winKeyCombo: {
            ctrlKey: true,
            key: ['h']
        },
        action: ActionEnum.OpenSearchAndReplace
    }
]

/**
 * Handles keyboard shortcuts. If a keyboard shortcut is pressed, the corresponding action is executed.
 * @param e The keyboard event.
 * @param actions The actions object.
 */
export const handleKeyboardShortcuts = (e: React.KeyboardEvent, actions: Actions) => {
    const operatingSystem = window.navigator.userAgent.toUpperCase().includes('MAC')
                    ? 'mac'
                    : 'windows'

    const shortcut = keyboardShortcuts.find(shortcut => {
        const keyCombo = operatingSystem === 'mac' ? shortcut.macKeyCombo : shortcut.winKeyCombo
        // If the special key combination doesn't match, return false.
        if (!!e.metaKey !== !!keyCombo.metaKey ||
            !!e.ctrlKey !== !!keyCombo.ctrlKey ||
            !!e.shiftKey !== !!keyCombo.shiftKey ||
            !!e.altKey !== !!keyCombo.altKey) {
            return false;
        }
        // If the special keys matched, check if the key is the same.
        return keyCombo.key.includes(e.key);
    })
    
    if (shortcut !== undefined) {
        actions.buildTimeActions[shortcut.action].actionFunction()
        if (shortcut.preventDefaultAndStopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}
