// Copyright (c) Mito
import React from 'react';

import '../../../css/layout/Col.css'
import { classNames } from '../../utils/classNames';

interface ColProps {
    /** 
        * @param [className] - Optional classes to add to this component
    */
    className?: string;
    /** 
        * @param [children] - The content that is going inside of this column, to actually be displayed. All overflow will be cut off.
    */
    children?: React.ReactNode,
    /** 
       * @param [span] - From 0 - 24, the amount of space of the row that this column is going to take up, out of the 24 units available. 
       * If left undefined, will just take up space of child component.
    */
    span?: number,
    /** 
       * @param [offset] - From 0 - 24, the amount of space to the left of this column
    */
    offset?: number,
    /** 
       * @param [offsetRight] - From 0 - 24, the amount of space to the right of this column
    */
    offsetRight?: number,
    /** 
       * @param [flex] - Set flex = '1' if you want this column to fill the remainder of the row,
       * but more generally set any flex value of this column. See here: 
       * https://developer.mozilla.org/en-US/docs/Web/CSS/flex
    */
    flex?: string
    /** 
       * @param [onClick] - A callback for when the column is clicked
    */
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    /** 
       * @param [title] - Title to put on the column div
    */
    title?: string;
    /** 
        * @param [style] - You can pass an arbitrary set of styles to the col to style it,
        * to make this component more flexible
    */
    style?: React.CSSProperties,
}


/**
 * A Col in a container element that should always be the child of a <Row> component.
 * It takes up some number of the 24 total units of space within a Row, and can be used
 * to create very consistent and stable layouts.
 */ 
const Col = (props: ColProps): JSX.Element => {

    const width = props.span ? `${props.span / 24 * 100}%`: undefined;
    const marginLeft = props.offset ? `${props.offset / 24 * 100}%` : undefined;
    const marginRight = props.offsetRight ? `${props.offsetRight / 24 * 100}%` : undefined;
    
    return (
        <div 
            className={classNames('spacing-col', props.className)} 
            style={{
                width: width, 
                marginLeft: marginLeft, 
                marginRight: marginRight,
                flex: props.flex,
                ...props.style
            }}
            onClick={props.onClick}
            title={props.title}
        >
            {props.children}
        </div>
    )
} 

export default Col;