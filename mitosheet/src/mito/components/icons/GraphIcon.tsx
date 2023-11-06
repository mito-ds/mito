import React from 'react';
import { IconVariant } from '../toolbar/Toolbar';

const GraphIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.93689" y="9.57031" width="4" height="7" fill="#C8C6C3" stroke="#797774"/>
                <rect x="8.93689" y="5.57031" width="4" height="11" fill="#9D6CFF" stroke="#6229AB"/>
                <rect x="4.93689" y="0.570312" width="4" height="16" fill="white" stroke="black"/>
            </svg>
        )
    } else {
        return (
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.93689" y="9.57031" width="4" height="7" fill="#C8C6C3" stroke="#797774"/>
                <rect x="8.93689" y="5.57031" width="4" height="11" fill="#9D6CFF" stroke="#6229AB"/>
                <rect x="4.93689" y="0.570312" width="4" height="16" fill="white" stroke="black"/>
            </svg>
        )
    }
}

export default GraphIcon