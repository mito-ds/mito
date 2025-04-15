/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

const BoxPlotSubMenuIcon = (props: { type: 'box' | 'violin' | 'ecdf' }): JSX.Element => {
    if (props.type === 'box') {
        return <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 0V44H45" stroke="var(--mito-text-medium)"/>
            <path d="M23 33.5V36.0388V38M23 38H20M23 38H26M23 16.427V8M23 8H20M23 8H26" stroke="var(--mito-highlight)"/>
            <path d="M16.5 13.5H29.5V33.5H16.5V13.5Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
            <circle cx="23" cy="41" r="1" fill="var(--mito-highlight-medium)"/>
            <circle cx="23" cy="5" r="1" fill="var(--mito-highlight-medium)"/>
            <circle cx="23" cy="2" r="1" fill="var(--mito-highlight-medium)"/>
        </svg>
    } else if (props.type === 'violin') {
        return <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 0V44H45" stroke="var(--mito-text-medium)"/>
            <path d="M23.0008 37.1482C22.9057 37.0179 22.7958 36.8679 22.6731 36.7012C22.2196 36.085 21.5916 35.2417 20.894 34.3335C19.5084 32.5297 17.817 30.4289 16.6746 29.3671C14.5451 27.3878 13.4996 24.9342 13.5 22.5001C13.5004 20.066 14.5469 17.6122 16.6759 15.6329C17.8182 14.5709 19.5093 12.4701 20.8946 10.6664C21.5921 9.7582 22.2199 8.91487 22.6733 8.29869C22.7769 8.158 22.8713 8.02911 22.9555 7.91395C22.967 7.93294 22.9789 7.95229 22.991 7.97199C23.274 8.43308 23.6969 9.0889 24.2598 9.87454C25.3851 11.4451 27.0729 13.5386 29.3256 15.6329C31.4546 17.6121 32.5002 20.0658 32.5 22.5C32.4998 24.9341 31.4536 27.3878 29.3248 29.3672C28.1826 30.4291 26.4917 32.53 25.1067 34.3337C24.4093 35.2418 23.7816 36.0852 23.3283 36.7014C23.2057 36.8679 23.0959 37.018 23.0008 37.1482Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
            <circle cx="23" cy="5" r="1" fill="var(--mito-highlight-medium)"/>
            <path d="M24 2C24 2.55228 23.5523 3 23 3C22.4477 3 22 2.55228 22 2C22 1.44772 22.4477 1 23 1C23.5523 1 24 1.44772 24 2Z" fill="var(--mito-highlight-medium)"/>
            <circle cx="23" cy="41" r="1" fill="var(--mito-highlight-medium)"/>
        </svg>        
    } else {
        return <svg width="46" height="45" viewBox="0 0 46 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 0V44H45" stroke="var(--mito-text-medium)"/>
            <line x1="4" y1="40.5" x2="5" y2="40.5" stroke="var(--mito-highlight)"/>
            <line x1="4" y1="39.5" x2="5" y2="39.5" stroke="var(--mito-highlight)"/>
            <line x1="5" y1="39.5" x2="6" y2="39.5" stroke="var(--mito-highlight)"/>
            <line x1="5" y1="38.5" x2="6" y2="38.5" stroke="var(--mito-highlight)"/>
            <line x1="5" y1="37.5" x2="6" y2="37.5" stroke="var(--mito-highlight)"/>
            <line x1="6" y1="37.5" x2="7" y2="37.5" stroke="var(--mito-highlight)"/>
            <line x1="7" y1="37.5" x2="8" y2="37.5" stroke="var(--mito-highlight)"/>
            <line x1="7" y1="36.5" x2="8" y2="36.5" stroke="var(--mito-highlight)"/>
            <line x1="7" y1="35.5" x2="8" y2="35.5" stroke="var(--mito-highlight)"/>
            <line x1="8" y1="35.5" x2="9" y2="35.5" stroke="var(--mito-highlight)"/>
            <line x1="9" y1="35.5" x2="10" y2="35.5" stroke="var(--mito-highlight)"/>
            <line x1="9" y1="34.5" x2="10" y2="34.5" stroke="var(--mito-highlight)"/>
            <line x1="9" y1="33.5" x2="10" y2="33.5" stroke="var(--mito-highlight)"/>
            <line x1="9" y1="32.5" x2="10" y2="32.5" stroke="var(--mito-highlight)"/>
            <line x1="10" y1="32.5" x2="11" y2="32.5" stroke="var(--mito-highlight)"/>
            <line x1="10" y1="31.5" x2="11" y2="31.5" stroke="var(--mito-highlight)"/>
            <line x1="10" y1="30.5" x2="11" y2="30.5" stroke="var(--mito-highlight)"/>
            <line x1="11" y1="30.5" x2="12" y2="30.5" stroke="var(--mito-highlight)"/>
            <line x1="12" y1="30.5" x2="13" y2="30.5" stroke="var(--mito-highlight)"/>
            <line x1="12" y1="29.5" x2="13" y2="29.5" stroke="var(--mito-highlight)"/>
            <line x1="12" y1="28.5" x2="13" y2="28.5" stroke="var(--mito-highlight)"/>
            <line x1="13" y1="28.5" x2="14" y2="28.5" stroke="var(--mito-highlight)"/>
            <line x1="14" y1="28.5" x2="15" y2="28.5" stroke="var(--mito-highlight)"/>
            <line x1="14" y1="27.5" x2="15" y2="27.5" stroke="var(--mito-highlight)"/>
            <line x1="15" y1="27.5" x2="16" y2="27.5" stroke="var(--mito-highlight)"/>
            <line x1="16" y1="27.5" x2="17" y2="27.5" stroke="var(--mito-highlight)"/>
            <line x1="17" y1="27.5" x2="18" y2="27.5" stroke="var(--mito-highlight)"/>
            <line x1="18" y1="27.5" x2="19" y2="27.5" stroke="var(--mito-highlight)"/>
            <line x1="18" y1="26.5" x2="19" y2="26.5" stroke="var(--mito-highlight)"/>
            <line x1="18" y1="25.5" x2="19" y2="25.5" stroke="var(--mito-highlight)"/>
            <line x1="19" y1="25.5" x2="20" y2="25.5" stroke="var(--mito-highlight)"/>
            <line x1="19" y1="24.5" x2="20" y2="24.5" stroke="var(--mito-highlight)"/>
            <line x1="19" y1="23.5" x2="20" y2="23.5" stroke="var(--mito-highlight)"/>
            <line x1="20" y1="23.5" x2="21" y2="23.5" stroke="var(--mito-highlight)"/>
            <line x1="21" y1="23.5" x2="22" y2="23.5" stroke="var(--mito-highlight)"/>
            <line x1="22" y1="23.5" x2="23" y2="23.5" stroke="var(--mito-highlight)"/>
            <line x1="23" y1="23.5" x2="24" y2="23.5" stroke="var(--mito-highlight)"/>
            <line x1="24" y1="23.5" x2="25" y2="23.5" stroke="var(--mito-highlight)"/>
            <line x1="24" y1="22.5" x2="25" y2="22.5" stroke="var(--mito-highlight)"/>
            <line x1="24" y1="21.5" x2="25" y2="21.5" stroke="var(--mito-highlight)"/>
            <line x1="25" y1="21.5" x2="26" y2="21.5" stroke="var(--mito-highlight)"/>
            <line x1="26" y1="21.5" x2="27" y2="21.5" stroke="var(--mito-highlight)"/>
            <line x1="26" y1="20.5" x2="27" y2="20.5" stroke="var(--mito-highlight)"/>
            <line x1="26" y1="19.5" x2="27" y2="19.5" stroke="var(--mito-highlight)"/>
            <line x1="27" y1="19.5" x2="28" y2="19.5" stroke="var(--mito-highlight)"/>
            <line x1="28" y1="19.5" x2="29" y2="19.5" stroke="var(--mito-highlight)"/>
            <line x1="28" y1="18.5" x2="29" y2="18.5" stroke="var(--mito-highlight)"/>
            <line x1="29" y1="18.5" x2="30" y2="18.5" stroke="var(--mito-highlight)"/>
            <line x1="30" y1="18.5" x2="31" y2="18.5" stroke="var(--mito-highlight)"/>
            <line x1="31" y1="18.5" x2="32" y2="18.5" stroke="var(--mito-highlight)"/>
            <line x1="32" y1="18.5" x2="33" y2="18.5" stroke="var(--mito-highlight)"/>
            <line x1="32" y1="17.5" x2="33" y2="17.5" stroke="var(--mito-highlight)"/>
            <line x1="32" y1="16.5" x2="33" y2="16.5" stroke="var(--mito-highlight)"/>
            <line x1="33" y1="16.5" x2="34" y2="16.5" stroke="var(--mito-highlight)"/>
            <line x1="33" y1="15.5" x2="34" y2="15.5" stroke="var(--mito-highlight)"/>
            <line x1="33" y1="14.5" x2="34" y2="14.5" stroke="var(--mito-highlight)"/>
            <line x1="34" y1="14.5" x2="35" y2="14.5" stroke="var(--mito-highlight)"/>
            <line x1="35" y1="14.5" x2="36" y2="14.5" stroke="var(--mito-highlight)"/>
            <line x1="36" y1="14.5" x2="37" y2="14.5" stroke="var(--mito-highlight)"/>
            <line x1="36" y1="13.5" x2="37" y2="13.5" stroke="var(--mito-highlight)"/>
            <line x1="37" y1="13.5" x2="38" y2="13.5" stroke="var(--mito-highlight)"/>
            <line x1="37" y1="12.5" x2="38" y2="12.5" stroke="var(--mito-highlight)"/>
            <line x1="38" y1="12.5" x2="39" y2="12.5" stroke="var(--mito-highlight)"/>
            <line x1="39" y1="12.5" x2="40" y2="12.5" stroke="var(--mito-highlight)"/>
            <line x1="40" y1="12.5" x2="41" y2="12.5" stroke="var(--mito-highlight)"/>
            <line x1="40" y1="11.5" x2="41" y2="11.5" stroke="var(--mito-highlight)"/>
            <line x1="40" y1="10.5" x2="41" y2="10.5" stroke="var(--mito-highlight)"/>
            <line x1="41" y1="10.5" x2="42" y2="10.5" stroke="var(--mito-highlight)"/>
            <line x1="41" y1="9.5" x2="42" y2="9.5" stroke="var(--mito-highlight)"/>
            <line x1="41" y1="8.5" x2="42" y2="8.5" stroke="var(--mito-highlight)"/>
            <line x1="42" y1="8.5" x2="43" y2="8.5" stroke="var(--mito-highlight)"/>
            <line x1="43" y1="8.5" x2="44" y2="8.5" stroke="var(--mito-highlight)"/>
            <line x1="44" y1="8.5" x2="45" y2="8.5" stroke="var(--mito-highlight)"/>
            <line x1="44" y1="7.5" x2="45" y2="7.5" stroke="var(--mito-highlight)"/>
            <line x1="45" y1="7.5" x2="46" y2="7.5" stroke="var(--mito-highlight)"/>
        </svg>
    }
}

export default BoxPlotSubMenuIcon;