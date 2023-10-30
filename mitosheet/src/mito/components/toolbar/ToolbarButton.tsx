// Copyright (c) Mito

import React from 'react';
import { BuildTimeAction, EditorState } from '../../types';
import { classNames } from '../../utils/classNames';
import StepsIcon from '../icons/StepsIcon';

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
        action: BuildTimeAction;

        /** 
        * @param [setEditorState] - pass this if you want to close an open editor
        */
        setEditorState?: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
        
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

    }): JSX.Element => {

    const disabled = props.disabledTooltip !== undefined;
    const disabledTooltip = props.disabledTooltip ?? props.action.isDisabled();
    const highlightToobarItemClass = props.highlightToolbarButton === true ? 'mito-toolbar-button-draw-attention' : ''
    const hasDropdown = props.children !== undefined;
    
    return (
        <div 
            className={classNames('mito-toolbar-button-container', disabled ? 'mito-toolbar-button-container-disabled' : 'mito-toolbar-button-container-enabled')} 
            id={props.id}
            onClick={() => {
                if (disabled) {
                    return
                }

                if (props.setEditorState) {
                    props.setEditorState(undefined);
                }
                props.action.actionFunction();
            }}
        >
            <button 
                className={classNames('mito-toolbar-button', 'vertical-align-content', highlightToobarItemClass)} 
                type="button"
            >
                {/* 
                    The spacing of this button relies on the height of the icon itself! Note that all of the icons 
                    that we use have consistent heights. We leave it this way to force ourselves to design consistent 
                    icons. 
                    
                    If the icons have different heights, the text won't line up. 
                */}
                <span title={disabledTooltip || props.action.tooltip}>
                    <div className='mito-toolbar-button-icon-container'>
                        {props.iconOverride ?? (props.action.icon !== undefined ? <props.action.icon /> : <StepsIcon />)}
                        {hasDropdown && <div className='mito-toolbar-button-dropdown-icon'>▾</div>}
                    </div>
                    {(props.toolbarTitle ?? props.action.toolbarTitle) && <p className='mito-toolbar-button-label'> 
                        {props.toolbarTitle ?? props.action.toolbarTitle}
                    </p>}
                </span>
            </button>
            {props.children !== undefined && props.children}
        </div>
    );
}

export default ToolbarButton;