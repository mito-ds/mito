import { removeMarkdownCodeFormatting } from "./strings";

const copyToClipboard = (text: string) => {
    const codeWithoutMarkdown = removeMarkdownCodeFormatting(text)
    navigator.clipboard.writeText(codeWithoutMarkdown ?? '')
}

export default copyToClipboard;