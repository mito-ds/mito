
/* 
    The json data type expected by the ExcelToPythonGlossaryPage.

    See examples of this in use in the excel-to-python-page-contents folder.
*/
export type PageContent = {
    slug: string[];
    functionNameShort: string;
    functionNameLong: string;
    relatedFunctions: string[];
    purpose: string;
    titleCardParagraphs: string[];
    excelExplanation?: {
        paragraphs: string[],
        syntaxTable: {
            parameter: string,
            description: string,
            dataType: string
        }[],
        examplesTable: {
            formula: string,
            description: string,
            result: string
        }[]
    },
    equivalentCode: {
        introParagraphs: string[],
        codeSections: {
            title: string,
            shortTitle: string,
            paragraphs: string[],
            codeLines: string[]
        }[]
    },
    commonMistakes: {
        introParagraphs: string[],
        codeSections: {
            title: string,
            shortTitle: string, 
            paragraphs: string[],
            codeLines: string[]
        }[]
    },
    mitoCTA?: {
        codeLines: string[]
    }
}




