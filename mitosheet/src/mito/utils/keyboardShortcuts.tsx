/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ActionEnum, KeyboardShortcut } from "../types"
import { Actions } from "./actions"

/**
 * A list of all keyboard shortcuts in the app.
 */
export const keyboardShortcuts: KeyboardShortcut[] = [
    {
        macKeyCombo: {
            metaKey: true,
            keys: ['c']
        },
        winKeyCombo: {
            ctrlKey: true,
            keys: ['c']
        },
        skipIfInTextInput: true,
        skipIfTextSelected: true,
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
        skipIfInTextInput: true,
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
        skipIfInTextInput: true,
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
        skipIfInTextInput: true,
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
        skipIfInTextInput: true,
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
            shiftKey: true,
            keys: ['h']
        },
        action: ActionEnum.OpenFindAndReplace
    },
    {
        macKeyCombo: {
            ctrlKey: true,
            keys: ['G']
        },
        winKeyCombo: {
            altKey: true,
            keys: ['F1']
        },
        action: ActionEnum.Graph
    },
    {
        // Note: safari grabs this shortcut and doesn't allow us to override it.
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
        // Note: safari grabs this shortcut and doesn't allow us to override it.
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
        // TODO: The mac shortcut is not consistent with the Excel
        macKeyCombo: {
            shiftKey: true,
            ctrlKey: true,
            keys: ['L']
        },
        winKeyCombo: {
            altKey: true,
            keys: ['F11']
        },
        preventDefaultAndStopPropagation: true,
        action: ActionEnum.Pivot
    },
    {   
        macKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['`', '~']
        },
        winKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['`', '~']
        },
        action: ActionEnum.Set_Format_Default
    },
    {
        macKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['1', '!']
        },
        winKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['1', '!']
        },
        action: ActionEnum.Set_Format_Number
    },
    // Both ctrl+shift+2 and ctrl+shift+3 are used to set datetime type, because in Excel
    // ctrl+shift+2 is used to set "time" and ctrl+shift+3 is used to set "date". For our purposes,
    // we just set it to the same type.
    {
        macKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['@', '2']
        },
        winKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['@', '2']
        },
        action: ActionEnum.Set_DateTime_Dtype
    },
    {
        macKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['3', '#']
        },
        winKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['3', '#']
        },
        action: ActionEnum.Set_DateTime_Dtype
    },
    {
        macKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['4', '$']
        },
        winKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['4', '$']
        },
        action: ActionEnum.Set_Format_Currency
    },
    {
        macKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['5', '%']
        },
        winKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['5', '%']
        },
        action: ActionEnum.Set_Format_Percent
    },
    {
        macKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['6', '^']
        },
        winKeyCombo: {
            ctrlKey: true,
            shiftKey: true,
            keys: ['6', '^']
        },
        action: ActionEnum.Set_Format_Scientific
    }
]

export const keyboardShortcutsMap = new Map<ActionEnum, KeyboardShortcut>(keyboardShortcuts.map(shortcut => [shortcut.action, shortcut]))

/**
 * Used to determine if the user is on a mac or windows.
 * @returns 'mac' if the user is on a mac, 'windows' otherwise.
 */
export const getOperatingSystem = () => {
    return window.navigator.userAgent.toUpperCase().includes('MAC')
        ? 'mac'
        : 'windows';
}

/**
 * @param action - The action to get the keyboard shortcut for.
 * @returns A string describing the keyboard shortcut for the given action.
 */
export const getKeyboardShortcutString = (action: ActionEnum) => {
    // Find the keyboard shortcut for the given action.
    const shortcut = keyboardShortcutsMap.get(action);

    // If there is no keyboard shortcut for the given action, return undefined.
    if (shortcut === undefined) {
        return undefined;
    }

    // Get the key combo for the current operating system.
    const keyCombo = shortcut[window.navigator.userAgent.toUpperCase().includes('MAC') ? 'macKeyCombo' : 'winKeyCombo']

    // For mac, use the symbol associated with command key. For windows, use the word "Meta".
    const metaKey = getOperatingSystem() === 'mac' ? '⌘' : 'Meta';

    // If a key is a single character, make it uppercase. Otherwise, leave it as is.
    const key = keyCombo.keys[0].length === 1 ? keyCombo.keys[0].toUpperCase() : keyCombo.keys[0];

    // Create a string describing the keyboard shortcut.
    const keyComboString = `${keyCombo.ctrlKey ? 'Ctrl+' : ''}${keyCombo.shiftKey ? 'Shift+' : ''}${keyCombo.altKey ? 'Alt+' : ''}${keyCombo.metaKey ? `${metaKey}+` : ''}${key}`
    return keyComboString;
}

/**
 * Handles keyboard shortcuts. If a keyboard shortcut is pressed, the corresponding action is executed.
 * @param e The keyboard event.
 * @param actions The actions object.
 */
export const handleKeyboardShortcuts = (e: React.KeyboardEvent, actions: Actions) => {
    const operatingSystem = getOperatingSystem();

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

    if (shortcut === undefined) {
        return;
    }
    
    const shortcutIsDisabled = actions.buildTimeActions[shortcut.action].isDisabled();
    const isInTextInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    const isTextSelected = document.getSelection()?.toString() !== '';

    if (!shortcutIsDisabled && !(shortcut.skipIfInTextInput && isInTextInput) && !(shortcut.skipIfTextSelected && isTextSelected)) {
        actions.buildTimeActions[shortcut.action].actionFunction()
        if (shortcut.preventDefaultAndStopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}