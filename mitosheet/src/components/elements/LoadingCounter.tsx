// Copyright (c) Mito

import React, { useEffect, useState } from 'react';

/*
    Loading counter
*/
const LoadingCounter = (): JSX.Element => {
    // Keep track of the amount of time loading
    const [timeLoading, setTimeLoading] = useState(1);

    // Schedule a change to update the loading indicator, every 1 second
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
