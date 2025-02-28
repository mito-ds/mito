import { removeMarkdownCodeFormatting } from "./strings";

const copyToClipboard = async (text: string): Promise<void> => {
    const codeWithoutMarkdown = removeMarkdownCodeFormatting(text)
    await navigator.clipboard.writeText(codeWithoutMarkdown ?? '')
}

export default copyToClipboard;