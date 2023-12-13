// Copyright (c) Mito

import React from 'react';
import { BuildTimeAction, RunTimeAction } from '../../types';
import { classNames } from '../../utils/classNames';
import StepsIcon from '../icons/StepsIcon';
import { getOperatingSystem, keyboardShortcuts } from '../../utils/keyboardShortcuts';

/**
 * The ToolbarButton component is used to create each
 * button in the Toolbar. 
 */ 
const ToolbarButton = (
    props: {
        /** 
        * @param id - An option id to put on the element, so we can grab it elsewhere 
        */
        id?: string;

        /**
         * If there is a special case for the icon (see FullScreen)
         */
        iconOverride?: JSX.Element;

        /** 
        * @param action - The action to run when the toolbar button is clicked
        */
        action: BuildTimeAction | RunTimeAction;

        /**
         * Optional override of the action's title. 
         */
        toolbarTitle?: string;

        /**
        * @param [highlightToolbarButton] - Used to draw attention to the toolbar item. Defaults to False. 
        */ 
        highlightToolbarButton?: boolean; 

        /**
        * @param [disabledTooltip] - Set to a string if you want the tooltip to display
        */
        disabledTooltip?: string | undefined

        /**
        * @param [children] - A dropdown opened by the toolbar button
        */
        children?: JSX.Element

        onClick?: () => void;

        /**
         * When displaying the button, the text and icon can be displayed either horizontally or vertically
         */
        orientation?: 'horizontal' | 'vertical'

    }): JSX.Element => {

    const disabledTooltip = props.disabledTooltip ?? props.action.isDisabled();
    const disabled = !!disabledTooltip;
    const highlightToobarItemClass = props.highlightToolbarButton === true ? 'mito-toolbar-button-draw-attention' : ''
    const hasDropdown = props.children !== undefined;
    const orientation = props.orientation ?? 'vertical';
    const shortcut = keyboardShortcuts.find(shortcut => {
        return shortcut.action === props.action.staticType
    });
    let tooltip = disabledTooltip ?? props.action.tooltip ?? props.action.titleToolbar;
    if (shortcut !== undefined) {
        const keyCombo = shortcut[window.navigator.userAgent.toUpperCase().includes('MAC') ? 'macKeyCombo' : 'winKeyCombo']
        const metaKey = getOperatingSystem() === 'mac' ? '⌘' : 'Meta';
        const key = keyCombo.keys[0].length === 1 ? keyCombo.keys[0].toUpperCase() : keyCombo.keys[0];
        const keyComboString = `${keyCombo.ctrlKey ? 'Ctrl+' : ''}${keyCombo.shiftKey ? 'Shift+' : ''}${keyCombo.altKey ? 'Alt+' : ''}${keyCombo.metaKey ? `${metaKey}+` : ''}${key}`
        tooltip += `(${keyComboString})`
    }
    
    return (
        <div 
            className={classNames('mito-toolbar-button-container', orientation === 'vertical' ? 'vertical-align-content' : 'horizontal-align-content', disabled ? 'mito-toolbar-button-container-disabled' : 'mito-toolbar-button-container-enabled')} 
            id={props.id ?? `mito-toolbar-button-${props.action.staticType}`}
            onClick={() => {
                if (disabled) {
                    return
                }

                if (props.onClick !== undefined) {
                    props.onClick();
                }

                props.action.actionFunction();
            }}
        >
            <button 
                className={classNames('mito-toolbar-button', highlightToobarItemClass)} 
                type="button"
            >
                {/* 
                    The spacing of this button relies on the height of the icon itself! Note that all of the icons 
                    that we use have consistent heights. We leave it this way to force ourselves to design consistent 
                    icons. 
                    
                    If the icons have different heights, the text won't line up. 
                */}
                <span title={tooltip}>
                    <div className='mito-toolbar-button-icon-container'>
                        {props.iconOverride ?? (props.action.iconToolbar !== undefined ? <props.action.iconToolbar /> : <StepsIcon />)}
                        {hasDropdown && <div className='mito-toolbar-button-dropdown-icon'>▾</div>}
                        {props.children !== undefined && props.children}
                    </div>
                    {(props.toolbarTitle ?? props.action.titleToolbar) && <p className='mito-toolbar-button-label'> 
                        {props.toolbarTitle ?? props.action.titleToolbar}
                    </p>}
                </span>
            </button>
        </div>
    );
}

export default ToolbarButton;