import Image from 'next/image'

import pageStyles from '../../styles/Page.module.css'
import { classNames } from '../../utils/classNames'
import caseStudyCard from './CaseStudyCard.module.css' 

const CaseStudyCard = (props: {
    title: string,
    imageSrc: string,
    link: string,
    height: number,
    width: number,
    className?: string
}): JSX.Element => {

    return (
        <div 
            className={classNames(caseStudyCard.case_study_card_container, props.className)}
            onClick={props.link !== undefined ? () => window.open(props.link, '_blank'): undefined}
        >
            <Image src={props.imageSrc} alt="Mito Logo" height={props.height} width={props.width} />
        </div>
    )   
}

export default CaseStudyCard; 