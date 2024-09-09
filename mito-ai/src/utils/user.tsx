
export type OperatingSystem = 'mac' | 'windows'

export const getOperatingSystem = (): OperatingSystem => {
    if (navigator.userAgent.includes('Macintosh')) {
        return 'mac'
    } else {
        return 'windows'
    }
}