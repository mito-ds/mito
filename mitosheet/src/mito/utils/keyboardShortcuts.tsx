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
        if (e.metaKey && !keyCombo.metaKey) {
            return false;
        }
        if (e.ctrlKey && !keyCombo.ctrlKey) {
            return false;
        }
        if (e.shiftKey && !keyCombo.shiftKey) {
            return false;
        }
        if (e.altKey && !keyCombo.altKey) {
            return false;
        }
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
