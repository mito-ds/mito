// Copyright (c) Mito

import React from 'react';
import { classNames } from '../../utils/classNames';
import { getToolbarItemIcon, ToolbarButtonType } from './utils';

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
        * @param toolbarButtonType - The toolbaryItemType is used to determine the correct icon to display. 
        */
        toolbarButtonType: ToolbarButtonType;

        /** 
        * @param buttonTitle - The text to display underneath the icon. 
        */
        buttonTitle: string;

        /** 
        * @param buttonSubtext - The text to display when you hover over the button for a moment, as an added description.
        */
        buttonSubtext: string;

        /** 
        * @param onClick - The function to be called when the toolbar item is clicked
        */
        onClick: () => void;
        
        /**
        * @param [highlightToolbarButton] - Used to draw attention to the toolbar item. Defaults to False. 
        */ 
        highlightToolbarButton?: boolean; 

        /**
        * @param [children] - A dropdown opened by the toolbar button
        */
        children?: JSX.Element

        /**
        * @param [displayChildren] - If true, display the children prop, otherwise don't.
        */
        displayChildren?: boolean

    }): JSX.Element => {

    const highlightToobarItemClass = props.highlightToolbarButton === true ? 'toolbar-button-draw-attention' : ''

    return (
        <div 
            className='toolbar-button-container' 
            id={props.id}
            onClick={props.onClick}
        >
            <button 
                className={classNames('toolbar-button', 'vertical-align-content', highlightToobarItemClass)} 
                type="button"
            >
                {/* 
                    The spacing of this button relies on the height of the icon itself! Note that all of the icons 
                    that we use have consistent heights. We leave it this way to force ourselves to design consistent 
                    icons. 
                    
                    If the icons have different heights, the text won't line up. 
                */}
                <span title={props.buttonSubtext}>
                    <div className='toolbar-button-icon-container'>
                        {getToolbarItemIcon(props.toolbarButtonType)}
                    </div>
                    <p className='toolbar-button-label'> 
                        {props.buttonTitle}
                    </p>
                </span>
            </button>
            {props.displayChildren && props.children !== undefined && props.children}
        </div>
    );
}

export default ToolbarButton;