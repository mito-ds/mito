// Copyright (c) Mito
import React from 'react';

// import css
import '../../../css/elements/ColorInput.css'

interface DropdownSectionSeperatorProps {
    /** 
        * @param isDropdownSectionSeperator - This is required so that the dropdown knows what this object
        * is so that it doesn't filter it out of the search. It must be set to true
    */
    isDropdownSectionSeperator: true;
}

/**
 * Just a little line between sections in a dropdown
 */
const DropdownSectionSeperator = (props: DropdownSectionSeperatorProps): JSX.Element => {
    
    props.isDropdownSectionSeperator; // This is just so linting passes. See comment above about why we need this

    return (
        <div style={{width: '100%', borderTop: '1px solid #dadce0', paddingBottom: '3px', marginTop: '3px'}}/>
    )
}

export default DropdownSectionSeperator;