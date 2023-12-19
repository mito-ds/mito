
// Copyright (c) Mito

import React from 'react';

const CautionIcon = (props: { color?: string }): JSX.Element => {
    return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 10.2059V5.79412M1 14.25L7.5 1.75L14 14.25H1Z" stroke={props.color ?? "var(--mito-text)"}/>
        <path d="M8.22228 12.0439C8.22228 12.45 7.89893 12.7792 7.50005 12.7792C7.10118 12.7792 6.77783 12.45 6.77783 12.0439C6.77783 11.6378 7.10118 11.3086 7.50005 11.3086C7.89893 11.3086 8.22228 11.6378 8.22228 12.0439Z" fill={props.color ?? "var(--mito-text)"}/>
    </svg>;
}

export default CautionIcon;
