import type { InferGetStaticPropsType, GetStaticProps } from 'next'
import path from 'path'
import fs from 'fs'
import { PageContent } from './types'
import ExcelToPythonGlossaryPage from './[...slug]'

type Repo = {
  name: string
  stargazers_count: number
}

export const getStaticProps: GetStaticProps<{ pageContentJSONArray: PageContent[] }> = async () => {
  const fileNames = fs.readdirSync(path.join(process.cwd(), 'pages/excel-to-python'))
  const jsonFileNames = fileNames.filter(fileName => fileName.endsWith('.json'))
  const jsonFileContents = jsonFileNames.map(fileName => fs.readFileSync(path.join(process.cwd(), 'pages/excel-to-python', fileName), 'utf8'))

  // read json files and parse them as PageContent type

  const pageContentJSONArray: PageContent[] = jsonFileContents.map(file => JSON.parse(file))

  return { props: { pageContentJSONArray } }
}

export default function Page({
  pageContentJSONArray,
}: InferGetStaticPropsType<typeof getStaticProps>) {
    return (
        <>
            {pageContentJSONArray.map(pageContentJSON => (
                <ExcelToPythonGlossaryPage pageContent={pageContentJSON} />
            ))}
        </>

    )
    
    
}
