import pageStyles from '../../styles/Page.module.css'
import aiThesisStyles from './AIThesis.module.css'
import { useState } from 'react'
import ExpandableCard from '../ExpandableCard/ExpandableCard'


const AIThesis = (): JSX.Element => {

    const [aISectionOpen, setAISectionOpen] = useState<number| undefined>(undefined)

    return (
        <div className={pageStyles.background_card + ' ' + aiThesisStyles.ai_thesis_container}>
            <h1 className='margin-left-2rem'>
                Spreadsheets + AI = 👑
            </h1>
            <div className={pageStyles.subsection + ' ' + pageStyles.subsection_narrow_space_betweeen}>
                <div>
                    <ExpandableCard 
                        title={'Chatbots are fastest, sometimes'}
                        shortTitle={'Chatbots are fastest'} 
                        className='margin-top-3rem'
                        isOpen={aISectionOpen===0}
                        key={0}
                        onClick={() => {
                            setAISectionOpen((prevAISectionOPen) => {
                                return prevAISectionOPen !== 0 ? 0 : undefined
                            })
                        }}
                    >
                        <p>
                            AI powered chatbots are already the fastest way to perform simple data transformations.
                            But transformations that require lots of configuration and iteration, like pivot tables, are still easier in a spreadsheet.
                        </p>
                    </ExpandableCard>
                    <ExpandableCard 
                        title={'Spreadsheets are prompt builders'} 
                        shortTitle={'Spreadsheets build prompts'}
                        isOpen={aISectionOpen===1}
                        key={1}
                        onClick={() => {
                            setAISectionOpen(aISectionOpen !== 1 ? 1 : undefined)
                        }}
                    >
                        <p>
                            The more the AI knows about your data and analysis, the better chance the code it generates is useful. 
                            Spreadsheets are really good at giving the AI the context it needs because they understand your data&apos;s structure, content, and edit history. 
                        </p>
                    </ExpandableCard>
                    <ExpandableCard 
                        title={"Analysts are subject matter experts"}
                        shortTitle={"Analysts are SMEs"} 
                        isOpen={aISectionOpen===2}
                        key={2}
                        onClick={() => {
                            setAISectionOpen(aISectionOpen !== 2 ? 2 : undefined)
                        }}
                    >
                        <p>
                            AIs are far from perfect, but its important that your analysis is.
                            Spreadsheets are the most efficient tool for catching and correcting the AI&apos;s mistakes.
                        </p>
                    </ExpandableCard>
                </div>

                <div className={aiThesisStyles.ai_preview_video_container}>
                    <div id='video'>
                    <video className={aiThesisStyles.ai_preview_video} autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                        <source src="/ai_preview.mp4" />
                    </video>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AIThesis;
