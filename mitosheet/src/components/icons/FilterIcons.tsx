// Copyright (c) Mito

import React from 'react';


/* Note this variant is rest than the other variants, as it is a different color than the others! */
export const FilterIcon = (props: {purpleOrDark?: 'dark' | 'purple', nonEmpty?: boolean}): JSX.Element => {

    if (props.nonEmpty) {
        return (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.681 1H1.31902C1.0608 1 0.90821 1.31983 1.0608 1.55011L5.72061 8.58635V13L8.27939 11.8614V8.6887L12.9392 1.55011C13.0918 1.30704 12.9392 1 12.681 1Z" fill="#9D6CFF" stroke="#9D6CFF" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }

    if (props.purpleOrDark === 'dark') {
        return (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.681 1H1.31902C1.0608 1 0.90821 1.31983 1.0608 1.55011L5.72061 8.58635V13L8.27939 11.8614V8.6887L12.9392 1.55011C13.0918 1.30704 12.9392 1 12.681 1Z" stroke="#343434" strokeWidth="0.9909" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.681 1H1.31902C1.0608 1 0.90821 1.31983 1.0608 1.55011L5.72061 8.58635V13L8.27939 11.8614V8.6887L12.9392 1.55011C13.0918 1.30704 12.9392 1 12.681 1Z" stroke='var(--mito-purple)' strokeWidth="0.9909" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}