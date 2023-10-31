
// Copyright (c) Mito

import React from 'react';

const ConditionalFormatIcon = (props: {backgroundColor: string, color: string}): JSX.Element => {
    // TODO: use the props. Including this console log so that the linter doesn't complain
    console.log(props)
    return (
        <svg width="38" height="30" viewBox="0 0 38 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="0.0703125" width="38" height="29" rx="3" fill="#D7D7D7"/>
            <rect x="4.5" y="6.57031" width="29" height="16" fill="#F4F4F4" stroke="black"/>
            <rect x="4.5" y="11.5703" width="29" height="6" stroke="#797774"/>
            <rect x="4.5" y="6.57031" width="29" height="16" stroke="black"/>
            <rect x="12" y="11.5703" width="6.5" height="6" fill="#9D6CFF" stroke="#6229AB"/>
            <rect x="12" y="6.57031" width="11.5" height="5" fill="#F0969A" stroke="#C33725"/>
            <rect x="12" y="17.5703" width="14" height="5" fill="#F0969A" stroke="#C33725"/>
            <line x1="28.25" y1="7.07031" x2="28.25" y2="22.0703" stroke="#797775"/>
        </svg>
    )
}

export default ConditionalFormatIcon;