import { useCallback, useEffect, useState } from "react";
import { writeTextToClipboard } from "../utils/copy";

/* 
    A hook to allow you to copy code to the users clipboard, 
    while also resetting if the code has been copied after 
    some timeout.

    Adapted from: https://www.benmvp.com/blog/copy-to-clipboard-react-custom-hook/
*/
export const useCopyToClipboard = (text: string | undefined, resetTimeout = 2500): [() => void, boolean] => {
    const [copyStatus, setCopyStatus] = useState(false);

    const copy = useCallback(() => {
        if (text == undefined) {
            return
        }
        writeTextToClipboard(text).then(
            () => {setCopyStatus(true)},
            () => {setCopyStatus(false)}
        )
    }, [text])

    // When copy status is set to true, we reset it after the resetTimeout
    useEffect(() => {
        if (!copyStatus) {
            return;
        }

        const timer = setTimeout(() => {setCopyStatus(false)}, resetTimeout);
        return () => clearTimeout(timer);
    }, [copyStatus])

    return [copy, copyStatus];
}