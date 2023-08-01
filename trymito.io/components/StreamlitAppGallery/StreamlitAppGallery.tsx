import StreamlitAppCard from "../StreamlitAppCard/StreamlitAppCard";

import streamlitAppGalleryStyles from './StreamlitAppGallery.module.css'
import pageStyles from '../../styles/Page.module.css'
import { classNames } from "../../utils/classNames";

export const DATA_VERIFICATION_STREAMLIT_APP_LINK = 'https://trymito.io'

const StreamlitAppGallery = (): JSX.Element => {

    return (
        <div className={classNames(pageStyles.subsection, streamlitAppGalleryStyles.streamlit_gallery_container)}>
            <div className={streamlitAppGalleryStyles.streamlit_gallery_row}>
                <StreamlitAppCard
                    title={'Bank Performance Comparison'}
                    description={'Import and explore data from Snowflake'}
                    imageSrc={'/data-app/bank-performance.png'}
                    streamlitHref={'https://trymito.io'}
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
            </div>
        </div>
       
    )
}



export default StreamlitAppGallery; 