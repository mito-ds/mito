import path from 'path'
import fs from 'fs'
import { PageContent } from '../pages/excel-to-python/types'

export async function getPageContentJsonArray() {
    const fileNames = fs.readdirSync(path.join(process.cwd(), 'pages/excel-to-python'))
    const jsonFileNames = fileNames.filter(fileName => fileName.endsWith('.json'))
    const jsonFileContents = jsonFileNames.map(fileName => fs.readFileSync(path.join(process.cwd(), 'pages/excel-to-python', fileName), 'utf8'))

    // read json files and parse them as PageContent type

    const pageContentJsonArray: PageContent[] = jsonFileContents.map(file => JSON.parse(file))

    return pageContentJsonArray
}