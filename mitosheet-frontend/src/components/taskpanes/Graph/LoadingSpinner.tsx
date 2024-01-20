import React from 'react';
import '../../../../css/taskpanes/Graph/LoadingSpinner.css'

export default function LoadingSpinner(): JSX.Element {
    const circles = [...Array(12)].map((_, index) => {
        return (
            <div key={index}>
                <div className='div-after'></div>
            </div>
        )
    })

    return (
        <div className='lds-spinner'>
            {circles}
        </div>
    )
}