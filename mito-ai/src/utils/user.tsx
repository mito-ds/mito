/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


export type OperatingSystem = 'mac' | 'windows'

export const getOperatingSystem = (): OperatingSystem => {
    if (navigator.userAgent.includes('Macintosh')) {
        return 'mac'
    } else {
        return 'windows'
    }
}