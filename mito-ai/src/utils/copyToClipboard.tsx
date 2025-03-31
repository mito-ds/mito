/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { removeMarkdownCodeFormatting } from "./strings";

const copyToClipboard = async (text: string): Promise<void> => {
    const codeWithoutMarkdown = removeMarkdownCodeFormatting(text)
    await navigator.clipboard.writeText(codeWithoutMarkdown ?? '')
}

export default copyToClipboard;