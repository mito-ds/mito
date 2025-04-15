/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
import React, { ReactNode } from 'react';

import '../../../../css/elements/BottomLeftPopup.css';
import '../../../../css/popups/popups.css';
import { PopupLocation } from '../../types';
import { classNames } from '../../utils/classNames';

const DefaultPopup = (props: {
    children: ReactNode,
    popupLocation: PopupLocation
    className?: string
}): JSX.Element => {

    let popupLocationClass = undefined
    switch(props.popupLocation) {
        case PopupLocation.TopRight: 
            popupLocationClass = 'top-right-popup-container'
    }

    return (
        <div className={classNames('popup-container', popupLocationClass, props.className)}>
            {props.children}
        </div>
    )
}

export default DefaultPopup;