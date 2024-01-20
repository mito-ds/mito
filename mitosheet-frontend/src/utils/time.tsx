// Utilities for working with time

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK; // THIS IS OFF, but it's ok...
const YEAR = 365 * DAY;

/**
 * Given a timestamp, returns a string that represents how long ago 
 * this was - for displaying to the user.
 * 
 * If the timestamp doesn't exist, it just returns '--', like Finder.
 */
export const getLastModifiedString = (timestamp: number | null | undefined): string => {
    if (timestamp === null || timestamp === undefined) {
        return '--';
    }
    
    const delta = Math.floor(Date.now() / 1000) - timestamp;

    if (delta < HOUR) {
        const numMinutes = Math.round(delta / MINUTE);
        return `${numMinutes} mins`
    } else if (delta < DAY) {
        const numHours = Math.round(delta / HOUR);
        return `${numHours} hours`
    } else if (delta < WEEK) {
        const numDays = Math.round(delta / DAY);
        return `${numDays} days`
    } else if (delta < MONTH) {
        const numWeeks = Math.round(delta / WEEK);
        return `${numWeeks} weeks`
    } else if (delta < YEAR) {
        const numMonths = Math.round(delta / MONTH);
        return `${numMonths} months`
    } else {
        const numYears = Math.round(delta / YEAR);
        return `${numYears} years`
    }
}

// A helper function for sleeping for a number of seconds
export const sleep = async (timeoutInMilliseconds: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, timeoutInMilliseconds));
}

// A helper function for checking a condition once every 200ms for up to timeoutInMilliseconds,
// and returning if it's true. Otherwise, returns false
export const waitUntilConditionReturnsTrueOrTimeout = async (condition: (() => boolean) | (() => Promise<boolean>), timeoutInMilliseconds: number): Promise<boolean> => {

    let isConditionMet = await condition();
    for (let i = 0; (i < timeoutInMilliseconds / 200) && !isConditionMet; i++) {      
        if (!isConditionMet) {
            await sleep(timeoutInMilliseconds / 200);
        } else {
            break;
        }
        isConditionMet = await condition();
    }

    return isConditionMet;
}