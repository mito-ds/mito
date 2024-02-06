// Copyright (c) Mito

import React from 'react';

const StackedIcon = (props: { axis?: 'x' | 'y' }): JSX.Element => {
    return (
        <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            {
                (props.axis === undefined || props.axis === 'x') ? 
                    <>
                        <path d="M7 30C7 29.4477 7.44772 29 8 29H16C16.5523 29 17 29.4477 17 30V44H7V30Z" fill="#BA9BF8" stroke="#6229AB"/>
                        <path d="M7 17C7 16.4477 7.44772 16 8 16H16C16.5523 16 17 16.4477 17 17V29H7V17Z" fill="#E9E0FD" stroke="#6229AB"/>
                        <path d="M17 20C17 19.4477 17.4477 19 18 19H26C26.5523 19 27 19.4477 27 20V44H17V20Z" fill="#BA9BF8" stroke="#6229AB"/>
                        <path d="M17 8C17 7.44772 17.4477 7 18 7H26C26.5523 7 27 7.44772 27 8V22H17V8Z" fill="#E9E0FD" stroke="#6229AB"/>
                        <path d="M27 26.082C27 25.5297 27.4477 25.082 28 25.082H36C36.5523 25.082 37 25.5297 37 26.082V44.0009H27V26.082Z" fill="#BA9BF8" stroke="#6229AB"/>
                        <path d="M27 17C27 16.4477 27.4477 16 28 16H36C36.5523 16 37 16.4477 37 17V27.3514H27V17Z" fill="#E9E0FD" stroke="#6229AB"/>
                    </>
                    : <>
                        <path d="M15 27.0039C15.5523 27.0039 16 27.4516 16 28.0039L16 36.0039C16 36.5562 15.5523 37.0039 15 37.0039H1L1 27.0039L15 27.0039Z" fill="#BA9BF8" stroke="#6229AB"/>
                        <path d="M26 27.0039C26.5523 27.0039 27 27.4516 27 28.0039V36.0039C27 36.5562 26.5523 37.0039 26 37.0039H14L14 27.0039L26 27.0039Z" fill="#E9E0FD" stroke="#6229AB"/>
                        <path d="M25 9.00391C25.5523 9.00391 26 9.45162 26 10.0039V18.0039C26 18.5562 25.5523 19.0039 25 19.0039L1 19.0039L1 9.00391L25 9.00391Z" fill="#BA9BF8" stroke="#6229AB"/>
                        <path d="M37 9.00391C37.5523 9.00391 38 9.45162 38 10.0039V18.0039C38 18.5562 37.5523 19.0039 37 19.0039L23 19.0039V9.00391L37 9.00391Z" fill="#E9E0FD" stroke="#6229AB"/>
                    </>
            }
            <path d="M1 0V44H45" stroke="#797774"/>
        </svg>
    )
}

export default StackedIcon;