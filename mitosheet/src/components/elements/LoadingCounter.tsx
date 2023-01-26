// Copyright (c) Mito

import React, { useEffect, useState } from 'react';

/*
    Loading counter
*/
const LoadingCounter = (): JSX.Element => {
    // We use a count to track the number of the time loading.
    const [timeLoading, setTimeLoading] = useState(1);

    // Schedule a change to update the loading indicator, every .5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLoading(timeLoading => timeLoading + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span> &nbsp;( {timeLoading}s )</span>
    );
};

export default LoadingCounter;
