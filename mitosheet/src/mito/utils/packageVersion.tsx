/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { UserProfile } from "../types"

/*
    Returns True if the passed version is a previous version compared
    to the current version; note that this assumes semantic versioning
    with x.y.z!
*/
export const isAtLeastBenchmarkVersion = (currentVersion: string, benchmarkVersion: string): boolean => {
    const currentVersionParts = currentVersion.split('.').map(versionPart => parseInt(versionPart))
    const benchmarkVersionParts = benchmarkVersion.split('.').map(versionPart => parseInt(versionPart))

    // Make sure that the current version is of the format x.y.z
    if (currentVersionParts.length == 1) {
        currentVersionParts[1] = 0
    }
    if (currentVersionParts.length == 2) {
        currentVersionParts[2] = 0
    }

    for (let i = 0; i < currentVersionParts.length; i ++) {
        if (currentVersionParts[i] > benchmarkVersionParts[i]) {
            return true 
        } 

        if (currentVersionParts[i] < benchmarkVersionParts[i]) {
            return false 
        }
    }

    // If they are the same version, return True 
    return true 
}

/*
    Returns true if Python > 3.6 is installed, and Pandas > 0.25.0 is installed,
    as this is when openpyxl works.

    See here: https://pandas.pydata.org/pandas-docs/dev/whatsnew/v0.25.0.html
*/
export const isExcelImportEnabled = (userProfile: UserProfile): boolean => {
    return isAtLeastBenchmarkVersion(userProfile.pythonVersion, '3.6.0') && isAtLeastBenchmarkVersion(userProfile.pandasVersion, '0.25.0')
}
