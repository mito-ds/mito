import StreamlitAppCard from "./StreamlitAppCard";

import streamlitAppGalleryStyles from './StreamlitAppGallery.module.css'
import pageStyles from '../../styles/Page.module.css'
import { classNames } from "../../utils/classNames";

export const DATA_VERIFICATION_STREAMLIT_APP_LINK = 'https://mito-data-cleaning-demo.streamlit.app'
export const BASIC_DEMO_APP_LINK = 'https://mito-for-st-demo.streamlit.app'

const StreamlitAppGallery = (): JSX.Element => {

    return (
        <div className={classNames(pageStyles.subsection, streamlitAppGalleryStyles.streamlit_gallery_container)}>
            <div className={streamlitAppGalleryStyles.streamlit_gallery_row}>
                <StreamlitAppCard
                    title={'Bank Performance Comparison'}
                    description={'Import and explore data from Snowflake'}
                    imageSrc={'/data-app/bank-performance.png'}
                    streamlitHref={'https://bank-performance.streamlit.app'}
                    gitHubHref={'https://github.com/mito-ds/snowflake-streamlit-bank-performance-demo'}
                    tags={['Finance', 'Snowflake']} 
                />
                <StreamlitAppCard
                    title={'Data Quality Verification'}
                    description={'Pass checks before exporting data'}
                    imageSrc={'/data-app/data-cleaning-verification.png'}
                    streamlitHref={DATA_VERIFICATION_STREAMLIT_APP_LINK}
                    gitHubHref={'https://github.com/mito-ds/data-cleaning-demo'}
                    tags={['Data Cleaning']} 
                />
                <StreamlitAppCard
                    title={'Basic Spreadsheet Demo'}
                    description={'Explore the Mito spreadsheet component'}
                    imageSrc={'/data-app/mito-for-st-demo.png'}
                    streamlitHref={BASIC_DEMO_APP_LINK}
                    gitHubHref={'https://github.com/mito-ds/mito-for-streamlit-demo'}
                    tags={['Data Exploration', 'Data Cleaning']} 
                />
            </div>
        </div>
       
    )
}



export default StreamlitAppGallery; 