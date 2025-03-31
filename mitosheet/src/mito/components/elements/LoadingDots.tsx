/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { useEffect, useState } from 'react';

/*
    Dot, dot, dots. They count, so that you can display something as loading.
*/
const LoadingDots = (): JSX.Element => {
    // We use a count to track the number of ...s to display.
    // 0 -> '', 1 -> '.', 2 -> '..', 3 -> '...'. Wraps % 4.
    const [indicatorState, setIndicatorState] = useState(1);

    // Schedule a change to update the loading indicator, every .5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setIndicatorState(indicatorState => indicatorState + 1);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const someNumberOfDots = '.'.repeat(indicatorState % 4);

    return (
        <>
            {someNumberOfDots}
        </>
    );
};

export default LoadingDots;
