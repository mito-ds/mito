import { MitoError } from "../types";


export function isMitoError(possibleError: MitoError | unknown | null | undefined): possibleError is MitoError {
    return (possibleError !== null && possibleError !== undefined) && ((possibleError as MitoError).to_fix !== undefined);
}