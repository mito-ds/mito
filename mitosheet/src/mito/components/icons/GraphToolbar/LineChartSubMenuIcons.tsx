// Copyright (c) Mito

import React from 'react';

const LineChartSubMenuIcon = (props: { type: 'linear' | 'interpolated' | 'horizontal' }): JSX.Element => {
    if (props.type === 'linear') {
        return <svg width="49" height="45" viewBox="0 0 49 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.90625 0V44H48.9062" stroke="#797774"/>
            <path d="M4.82324 24L14.8433 11.9605L29.2099 17.459L42.7313 12.959" stroke="#9D6CFF"/>
            <path d="M4.82324 37L13.7263 26.4841L27.6704 32.9841L40.3466 3.98167" stroke="#6229AB"/>
        </svg>
    } else if (props.type === 'interpolated') {
        return <svg width="50" height="45" viewBox="0 0 50 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.35938 0V44H49.3594" stroke="#797774"/>
            <path d="M5.27637 24L10.6023 17.6007C13.4184 14.2171 17.7878 12.914 21.5233 14.3437L26.709 16.3285C28.6264 17.0623 30.7669 17.0916 32.8087 16.4121L43.1845 12.959" stroke="#9D6CFF"/>
            <path d="M5.27637 37L9.58887 31.9063C12.3129 28.6888 16.5578 27.5928 20.0288 29.2108V29.2108C24.459 31.2759 29.918 28.8784 32.0874 23.9149L40.7997 3.98167" stroke="#6229AB"/>
        </svg>
    } else {
        return <svg width="48" height="45" viewBox="0 0 48 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.05469 0V44H47.0547" stroke="#797774"/>
            <path d="M2.96955 24.0001L12.9896 24.0001L12.9896 11.9606L27.3562 11.9606L27.3562 17.4591L40.8778 17.459L40.8776 12.9591" stroke="#9D6CFF"/>
            <path d="M2.99932 37.5H12.9993L12.9993 31H26.9993L26.9993 38H40.499L40.499 25" stroke="#6229AB"/>
        </svg>        
    }                
}

export default LineChartSubMenuIcon;