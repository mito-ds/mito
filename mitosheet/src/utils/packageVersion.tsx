
/*
    Returns True if the passed version is a previous version compared
    to the current version; note that this assumes semantic versioning
    with x.y.z!
*/
export const isAfterBenchmarkVersion = (currentVersion: string, benchmarkVersion: string): boolean => {
    const benchmarkVersionParts = benchmarkVersion.split('.').map(versionPart => parseInt(versionPart))
    const currentVersionParts = currentVersion.split('.').map(versionPart => parseInt(versionPart))

    if (benchmarkVersionParts[0] > currentVersionParts[0]) {
        return false
    }

    if (benchmarkVersionParts[1] > currentVersionParts[1]) {
        return false
    }

    if (benchmarkVersionParts[2] > currentVersionParts[2]) {
        return false
    }

    return true
}

    