// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import LoadingDots from './elements/LoadingDots';

// import css
import "../../css/loading-indicator.css";

/*
    A tiny, upper left modal that tells the user that the operation is
    loading.

    By default, does not displaying anything for the first .5 seconds it
    is rendered, so that only long running ops actually display a loading
    bar.
*/
const LoadingIndicator = (): JSX.Element => {
    // We use a count to track the number of ...s to display.
    // 0 -> '', 1 -> '.', 2 -> '..', 3 -> '...'. Wraps % 4.
    const [display, setDisplay] = useState(false);

    // Only display this after 500 ms
    useEffect(() => {
        setTimeout(() => {
            setDisplay(true);
        }, 500);
    }, []);

    // We start the indicator at -1, so that we don't display anything
    // for the first half second. This makes us only display the indicator
    // for actually long running operations.
    if (!display) {
        return <React.Fragment/>
    }

    return (
        <div className='loading-indicator-container'>
            <p className='ml-20px'>
                Loading<LoadingDots/>
            </p>
        </div>
    );
};

export default LoadingIndicator;