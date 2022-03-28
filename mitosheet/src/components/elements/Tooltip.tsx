// Copyright (c) Mito
import React from 'react';

// import css
import QuestionMarkIcon from '../icons/QuestionMarkIcon';

interface TooltipProps {
    /** 
        * @param title - The test to display when the tooltip is hovered on.
    */
    title: string;
}

/**
 * The Tooltip component, which is useful if you're looking to make it clear
 * to the user that they can hover over something to get the title for it.
 */
const Tooltip = (props: TooltipProps): JSX.Element => {

    return (
        <div title={props.title} className='tooltip'>
            <QuestionMarkIcon/>
        </div>
    )
}

export default Tooltip;