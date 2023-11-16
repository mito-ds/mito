// Copyright (c) Mito

import React from 'react';


/* Note this variant is rest than the other variants, as it is a different color than the others! */
export const FilterIcon = (props: {sortIncluded?: boolean, nonEmpty?: boolean}): JSX.Element => {

    if (props.nonEmpty) {
        return (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.681 1H1.31902C1.0608 1 0.90821 1.31983 1.0608 1.55011L5.72061 8.58635V13L8.27939 11.8614V8.6887L12.9392 1.55011C13.0918 1.30704 12.9392 1 12.681 1Z" fill="var(--mito-highlight)" stroke="var(--mito-highlight)" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }

    if (props.sortIncluded) {
        return (
            <svg width="25" height="19" viewBox="0 0 25 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.1215 2.07031H7.97224C7.62794 2.07031 7.42449 2.38755 7.62794 2.61596L13.841 9.59515V17.0703H17.2527V9.69667L23.4658 2.61596C23.6693 2.37486 23.4658 2.07031 23.1215 2.07031Z" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M3.73242 1.59082L1.78906 8.07031H0.871094L3.16113 0.960938H3.7373L3.73242 1.59082ZM5.30469 8.07031L3.36133 1.59082L3.35156 0.960938H3.93262L6.22266 8.07031H5.30469ZM5.30469 5.43848V6.20996H1.87695V5.43848H5.30469Z" fill="var(--mito-highlight)"/>
                <path d="M5.73926 16.3037V17.0703H1.7207V16.3037H5.73926ZM5.6123 10.6445L1.93066 17.0703H1.37891V16.3672L5.05566 9.96094H5.6123V10.6445ZM5.23145 9.96094V10.7324H1.4082V9.96094H5.23145Z" fill="var(--mito-text)"/>
            </svg>
        )
    } else {
        return (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.681 1H1.31902C1.0608 1 0.90821 1.31983 1.0608 1.55011L5.72061 8.58635V13L8.27939 11.8614V8.6887L12.9392 1.55011C13.0918 1.30704 12.9392 1 12.681 1Z" stroke="var(--mito-text)" strokeWidth="0.9909" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}