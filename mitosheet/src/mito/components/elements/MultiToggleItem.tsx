/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

import '../../../../css/elements/MultiToggleBox.css'
import { classNames } from '../../utils/classNames';
import Col from '../layout/Col';
import Row from '../layout/Row';

/* 
  A single item that can be toggled 
*/
const MultiToggleItem = (props: {
    /** 
        * @param title - The title on the right side of this multi toggle item
    */
    title: React.ReactNode,
    /** 
        * @param toggled - The state of the toggle for this item
    */
    toggled: boolean,
    /** 
        * @param onToggle - The callback that should actually do the toggling in whatever manages the state for this toggle
    */
    onToggle: () => void;
    /** 
        * @param index - The index of the item in the state that stores the toggles
    */
    index: number,
    /** 
        * @param [rightText] - Text to display on the right side of the element - useful for metadata
    */
    rightText?: string,
    /** 
        * @param [rightTextSpan] - Optionally, set the size of the column to display the right text. Defaults to 4
    */
    rightTextSpan?: number,
    /** 
        * @param [disabled] - Optionally set this to true to disable toggling this element
    */
    disabled?: boolean,
}): JSX.Element => {

    const rightTextSpan = props.rightTextSpan || 4;

    return (
        <div 
            className={
                classNames(
                    'multi-toggle-box-row', 'text-overflow-hide', 
                    {
                        'multi-toggle-box-row-selected': props.toggled,
                        'multi-toggle-box-row-disabled': props.disabled
                    }
                )
            }
            onClick={() => {
                if (props.disabled) {
                    return;
                }
                props.onToggle()
            }}
        >
            <Row 
                justify={'space-between'}
                align='center'
                suppressTopBottomMargin
            >
                <Col span={props.rightText ? 24 - rightTextSpan : 24}>
                    <Row align='center' justify='start' suppressTopBottomMargin>
                        <Col offset={1}>
                            <input
                                name={'input'}
                                type="checkbox"
                                checked={props.toggled}
                            />
                        </Col>
                        <Col span={14}>
                            <span title={props.title?.toString()}>
                                {props.title}
                            </span>
                        </Col>
                    </Row>
                </Col>
                {props.rightText && 
                    <Col span={rightTextSpan} offset={1}>
                        {props.rightText}
                    </Col>
                }
            </Row>
        </div>
    )
}

export default MultiToggleItem;
