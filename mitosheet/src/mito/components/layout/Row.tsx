/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
import React from 'react';

import '../../../../css/layout/Row.css'
import { classNames } from '../../utils/classNames';

interface RowProps {
    /** 
        * @param [className] - Optional class name to apply to this row
    */
    className?: string,
    /** 
        * @param children - The Cols that are going to be inside this row
    */
    children: React.ReactNode
    /** 
        * @param [justify] - How to justify the Cols inside this row. Defaults to 'start'
    */
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly',
    /** 
        * @param [align] - How to verticaly align the content. Defaults to 'top'
    */
    align?: 'top' | 'center' | 'end',
    /** 
        * @param [style] - You can pass an arbitrary set of styles to the row to style it,
        * to make this component more flexible
    */
    style?: React.CSSProperties,
    /** 
        * @param [suppressTopBottomMargin] - If you want to turn off the rows top and bottom
        * margin that is on by default, set this to true
    */
    suppressTopBottomMargin?: boolean,

    /**
     * @param [title] - Tooltip to be displayed when the user's mouse hovers over the row
     */
    title?: string
    /** 
       * @param [onClick] - A callback for when the row is clicked
    */
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

/**
 * The Row component is the base spacing component for Mito, and is used
 * to build pretty layouts that require not much configuration. 
 * 
 * A Row is simply a flexbox container that holds Cols. The Row can be understood
 * to have 24 units of space that the columns can claim - either for internal
 * content or for spacing between them. 
 * 
 * Example usage:
 * <Row>
 *      <Col>
 *          Content 1
 *      </Col>
 *      <Col>
 *          Content 2
 *      </Col>
 * </Row>
 * 
 * Furthermore, Rows support different types of justifications and aligntment, 
 * similar to a flexbox itself. This makes it very easy to get a large number 
 * of layouts, without having to write any custom CSS code. 
 * 
 * See the PivotTable component for a great example of how these Rows and Cols 
 * can be used - they eliminated all custom CSS code for the pivot tables - 
 * and it also looks much better as a result!
 * 
 * See spacing/README.md for more information on the motivation as the to spacing
 * components.
 */
const Row = (props: RowProps): JSX.Element => {

    const marginClass = props.suppressTopBottomMargin ? 'spacing-row-no-top-bottom-margin' : 'spacing-row-top-bottom-margin';

    return (
        <div
            className={classNames(props.className, 'spacing-row', marginClass)}
            title={props.title}
            onClick={props.onClick}
            style={{
                ...props.style,
                justifyContent: props.justify,
                alignItems: props.align,
            }}
        >
            {props.children}
        </div>
    )
}

export default Row;