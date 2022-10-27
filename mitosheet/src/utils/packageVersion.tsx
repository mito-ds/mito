import { UserProfile } from "../types"

/*
    Returns True if the passed version is a previous version compared
    to the current version; note that this assumes semantic versioning
    with x.y.z!
*/
export const isAfterBenchmarkVersion = (currentVersion: string, benchmarkVersion: string): boolean => {
    console.log(currentVersion)
    console.log(currentVersion.split('.').map(versionPart => parseInt(versionPart)))
    const currentVersionParts = currentVersion.split('.').map(versionPart => parseInt(versionPart))
    console.log('111')
    const benchmarkVersionParts = benchmarkVersion.split('.').map(versionPart => parseInt(versionPart))

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

/*
    Returns true if Python > 3.6 is installed, and Pandas > 0.25.0 is installed,
    as this is when openpyxl works.

    See here: https://pandas.pydata.org/pandas-docs/dev/whatsnew/v0.25.0.html
*/
export const isExcelImportEnabled = (userProfile: UserProfile): boolean => {
    console.log("Pandas Version: ", userProfile.pandasVersion)
    return isAfterBenchmarkVersion(userProfile.pythonVersion, '3.6.0') && isAfterBenchmarkVersion(userProfile.pandasVersion, '0.25.0')
}
