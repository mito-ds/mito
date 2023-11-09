import path from 'path'
import fs from 'fs'
import { PageContent } from '../excel-to-python-page-contents/types'

export type GlossaryPageInfo = {
    functionNameShort: string,
    purpose: string,
    slug: string[],
}

export const getGlossaryPageInfo = async (pageContentsJsonArray: PageContent[]): Promise<GlossaryPageInfo[]> => {
  
    // Get information about each glossay page
    return pageContentsJsonArray.map((pageContentsJson) => {
      return {
        functionNameShort: pageContentsJson.functionNameShort,
        purpose: pageContentsJson.purpose,
        slug: [...pageContentsJson.slug]
      }
    })
}

export async function getPageContentJsonArray() {
    const relativePath = './excel-to-python-page-contents/'

    const fileNames = fs.readdirSync(path.join(process.cwd(), relativePath))
    const jsonFileNames = fileNames.filter(fileName => fileName.endsWith('.json'))
    const jsonFileContents = jsonFileNames.map(fileName => fs.readFileSync(path.join(process.cwd(), relativePath, fileName), 'utf8'))

    // read json files and parse them as PageContent type

    const pageContentJsonArray: PageContent[] = jsonFileContents.map(file => JSON.parse(file))

    return pageContentJsonArray
}