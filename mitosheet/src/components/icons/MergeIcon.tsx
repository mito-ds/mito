// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';


const MergeIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.49521 14.267C11.0824 14.267 13.9904 11.359 13.9904 7.77182C13.9904 4.18462 11.0824 1.27661 7.49521 1.27661C3.908 1.27661 1 4.18462 1 7.77182C1 11.359 3.908 14.267 7.49521 14.267Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M11.9913 14.267C15.5785 14.267 18.4865 11.359 18.4865 7.77182C18.4865 4.18462 15.5785 1.27661 11.9913 1.27661C8.4041 1.27661 5.49609 4.18462 5.49609 7.77182C5.49609 11.359 8.4041 14.267 11.9913 14.267Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.17099 14.267C10.7582 14.267 13.6662 11.359 13.6662 7.77182C13.6662 4.18462 10.7582 1.27661 7.17099 1.27661C3.58378 1.27661 0.675781 4.18462 0.675781 7.77182C0.675781 11.359 3.58378 14.267 7.17099 14.267Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M11.6671 14.267C15.2543 14.267 18.1623 11.359 18.1623 7.77182C18.1623 4.18462 15.2543 1.27661 11.6671 1.27661C8.07988 1.27661 5.17188 4.18462 5.17188 7.77182C5.17188 11.359 8.07988 14.267 11.6671 14.267Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>

        )
    }
}

export default MergeIcon;

