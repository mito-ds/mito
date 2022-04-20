// Utilities for the Open Source version of Mito that deal with Mito Pro

// If the user signs up for pro, this is the access code they must put in

const hash = (str: string): number => {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

export const checkProAccessCode = (accessCode: string): boolean => {
    return hash(accessCode) == 1979576830;
}