// Copyright (c) Mito

import React from 'react';
import '../../../css/taskpane-error.css'

/*
    An error displayed by the taskpane
*/
const TaskpaneError = (
    props: {
        message: string,
    }): JSX.Element => {

    // Don't display the error if no message is given
    if (props.message === '') {
        return <React.Fragment/>
    }

    return (
        <p className='taskpane-error-container'>
            <div className='taskpane-error-error-icon'>
                <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0)">
                        <path d="M15 30.0001C6.71568 30.0001 -6.48499e-05 23.2843 -6.48499e-05 15C-6.48499e-05 6.71574 6.71568 0 15 0C23.2843 0 30 6.71574 30 15C30 23.2843 23.2843 30.0001 15 30.0001Z" fill="#E84849"/>
                        <path d="M2.80608 15.5612C2.80608 16.6244 3.66849 17.4866 4.73149 17.4866H25.2692C26.3324 17.4866 27.1948 16.6244 27.1948 15.5612V14.438C27.1948 13.3748 26.3324 12.5126 25.2692 12.5126H4.73149C3.66849 12.5126 2.80608 13.3748 2.80608 14.438V15.5612Z" fill="#8A2D2E"/>
                    </g>
                    <defs>
                        <clipPath id="clip0">
                            <rect width="30" height="30" fill="white" transform="matrix(-1 0 0 1 30 0)"/>
                        </clipPath>
                    </defs>
                </svg>
            </div>
            <p className='taskpane-error-message ml-p5'>
                {props.message}
            </p>
        </p>             
            
    );
};

export default TaskpaneError;