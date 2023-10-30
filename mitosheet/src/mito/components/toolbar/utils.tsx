// Copyright (c) Mito
import React from 'react';

import { Action, UserProfile } from '../../types';
import DropdownItem from '../elements/DropdownItem';
import StepsIcon from '../icons/StepsIcon';

/* 
    Each toolbar button icon has both a light and dark option. 
    We use the light version when its on a dark background (ie: when 
    the toolbar button is hovered over), and the dark version when its 
    on a light background (ie: at rest). 
*/
export type IconVariant = 'light' | 'dark'

/* 
    Helper function for getting the light and dark version of each 
    toolbar icon. 
*/
export const getToolbarItemIcon = (action: Action): JSX.Element => {
    return action.icon !== undefined ? <action.icon /> : <StepsIcon />
}

/**
 * A helper function that makes dropdown items for the toolbar menus. This is
 * a function and not a component itself because the dropdown _expects_ to get
 * a DropdownItem as it's child, so we cannot wrap this in another component
 */
export const makeToolbarDropdownItem = (action: Action, userProfile: UserProfile, supressFocusSettingOnClose?: boolean, subtext?: string): JSX.Element => {

    const disabledMessage = action.isDisabled();
    return (
        <DropdownItem 
            key={action.longTitle}
            title={action.longTitle}
            onClick={action.actionFunction}
            disabled={disabledMessage !== undefined}                   
            tooltip={disabledMessage}
            subtext={subtext}     
            rightText={getToolbarDropdownItemRightText(action, userProfile)}
            supressFocusSettingOnClose={supressFocusSettingOnClose}
        />
    )
}

const getToolbarDropdownItemRightText = (action: Action, userProfile: UserProfile): string | undefined => {
    if (action.requiredPlan === 'pro' && !userProfile.isPro) {
        return 'Mito Pro'
    }

    if (action.requiredPlan === 'enterprise' && !userProfile.isEnterprise) {
        return 'Mito Enterprise'
    }

    return window.navigator.userAgent.toUpperCase().includes('MAC')
        ? action.displayKeyboardShortcuts?.mac
        : action.displayKeyboardShortcuts?.windows
}