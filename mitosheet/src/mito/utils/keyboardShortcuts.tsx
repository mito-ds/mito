import { ActionEnum, KeyboardShorcut } from "../types"
import { Actions } from "./actions"

/**
 * A list of all keyboard shortcuts in the app.
 */
export const keyboardShortcuts: KeyboardShorcut[] = [
    {
        macKeyCombo: {
            metaKey: true,
            keys: ['c']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: ['c']
        },
        action: ActionEnum.Copy
    },
    {
        macKeyCombo: {
            metaKey: true,
            keys: ['f']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: ['f']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.OpenFind,
        jupyterLabCommand: 'mitosheet:open-search',
    },
    {
        macKeyCombo: {
            metaKey: true,
            keys: ['z']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: ['z']
        },
        preventDefaultAndStopPropagation: true,
        jupyterLabCommand: 'mitosheet:mito-undo',
        action: ActionEnum.Undo
    },
    {
        macKeyCombo: {
            metaKey: true,
            keys: ['y']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: ['y']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.Redo
    },
    {
        macKeyCombo: {
            ctrlKey: true,
            keys: [' ']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: [' ']
        },
        action: ActionEnum.Select_Columns
    },
    {
        macKeyCombo: {
            shiftKey: true,
            keys: [' ']
        },
        winKeyCombo: {
            shiftKey: true,
            keys: [' ']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.Select_Rows
    },
    {
        macKeyCombo: {
            metaKey: true,
            keys: ['a']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: ['a']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.Select_All
    },
    {
        macKeyCombo: {
            altKey: true,
            keys: ['ArrowLeft']
        },
        winKeyCombo: {
            altKey: true,
            // TODO: this  is not consistent with the Excel shortcut in windows. 
            // But Edge grabs focus when pressing ctrl+PageUp/PageDown (which is the Excel shortcut)
            keys: ['ArrowLeft']
        },
        action: ActionEnum.Open_Previous_Sheet
    },
    {
        macKeyCombo: {
            altKey: true,
            keys: ['ArrowRight']
        },
        winKeyCombo: {
            altKey: true,
            // TODO: this  is not consistent with the Excel shortcut in windows. 
            // But Edge grabs focus when pressing ctrl+PageUp/PageDown (which is the Excel shortcut)
            keys: ['ArrowRight']
        },
        action: ActionEnum.Open_Next_Sheet
    },
    {
        macKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['F']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: ['h']
        },
        action: ActionEnum.OpenFindAndReplace
    },
    {
        macKeyCombo: {
            altKey: true,
            keys: ['F1']
        },
        winKeyCombo: {
            altKey: true,
            keys: ['F1']
        },
        action: ActionEnum.Graph
    },
    {
        macKeyCombo: {
            metaKey: true,
            keys: ['o']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: ['o']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.Import_Files
    },
    {
        macKeyCombo: {
            altKey: true,
            keys: ['ArrowDown']
        },
        winKeyCombo: {
            altKey: true,
            keys: ['ArrowDown']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.Filter
    },
    {
        macKeyCombo: {
            metaKey: true,
            keys: ['m']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: ['m']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.Merge
    },
    {
        macKeyCombo: {
            shiftKey: true,
            ctrlKey: true,
            keys: ['L']
        },
        winKeyCombo: {
            shiftKey: true,
            ctrlKey: true,
            keys: ['L']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.Pivot
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
        return keyCombo.keys.includes(e.key);
    })

    if (shortcut !== undefined && !actions.buildTimeActions[shortcut.action].isDisabled()) {
        actions.buildTimeActions[shortcut.action].actionFunction()
        if (shortcut.preventDefaultAndStopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}
