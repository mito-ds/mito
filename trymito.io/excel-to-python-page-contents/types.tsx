import React from "react";

export type PageContent = {
    slug: string[];
    functionNameShort: string;
    functioNameLong: string;
    relatedFunctions: string[];
    titleCardParagraphs: string[];
    excelExplanation: {
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
    }
}



