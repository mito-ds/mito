import pageStyles from '../../styles/Page.module.css'
import homeStyles from '../../styles/Home.module.css'
import aiThesisStyles from './AIThesis.module.css'
import { useEffect, useState } from 'react'


const AIThesis = (): JSX.Element => {
    
    const aiThesisPoints: Record<string, JSX.Element> = {
        'Chat bots are fastest, but not always': <div>
            <p>
                AI powered chat bots are already the fastest way to perform simple transformations of your data, like adding filters.
            </p>
            <p>
                But transformations that require lots of configuration and iteration are still easier to do in a spreadsheet, like pivot tables.
            </p>
            <p>
                It takes more time to write out the instructions for a pivot table than it does to just build it in a spreadsheet.
            </p>
        </div>,
        'Spreadsheets are prompt building champions': <div>
            <p>
                The more the AI knows about your data and analysis, the better chance the AI has at generating useful code. 
            </p>
            <p>
                Spreadsheets are really good at giving the AI the context it needs because they understand your data's structure, content, and edit history. 
            </p>
            <p>
                This makes spreadsheets great at building prompts without requiring too much user input.
            </p>
        </div>,
        'Don\'t blindly trust the machines': <div>
            <p>
                AIs are far from perfect, but its important that your analysis is. So you need tools to help you stay in the loop.
            </p>
            <p>
                Spreadsheets are the best tool for this because they allow you to see the data and the code side by side.
            </p>
            <p>
                This makes it easy to spot errors and understand how the AI is interpreting your data.
            </p>
        </div>
    }

    const [displayedAIThesisIdx, setDisplayedAIThesisIdx] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayedAIThesisIdx((prevIdx) => {
                if (prevIdx < Object.keys(aiThesisPoints).length - 1) {
                    return prevIdx + 1
                } else {
                    return 0
                }
            })
        }, 15000);
        return () => clearInterval(interval);
    }, [])

    return (
        <div className={pageStyles.subsection}>
            <div className={homeStyles.functionality_text + ' display-inline-block'}>
                <h1>
                    Spreadsheets + AI = 👑
                </h1>
                <div className={aiThesisStyles.ai_thesis_bullets_container}>
                    {Object.keys(aiThesisPoints).map((thesisKey: string, idx: number) => {
                        const selectedClass = displayedAIThesisIdx === idx ? aiThesisStyles.ai_thesis_bullet_selected : '' 
                        return (
                            <li 
                                onClick={() => setDisplayedAIThesisIdx(idx)}
                                key={idx}
                                className={aiThesisStyles.ai_thesis_bullet + ' ' + selectedClass}
                            >
                                {thesisKey}
                            </li>
                        )
                    })}
                </div>
            </div>
            <div className={homeStyles.functionality_media + ' ' + pageStyles.background_card + ' display-inline-block'} style={{maxWidth:800}}>
                <p>
                    {Object.values(aiThesisPoints)[displayedAIThesisIdx]}
                </p>
            </div>
        </div>
    )
}

export default AIThesis;
