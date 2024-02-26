import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import caseStudiesStyles from './CaseStudies.module.css'
import CaseStudyCard from './CaseStudyCard';
import caseStudyCardStyle from './CaseStudyCard.module.css'
import { classNames } from '../../utils/classNames';

const CaseStudies = (props: {}): JSX.Element => {

    return (
        <>
            <table className={classNames(caseStudiesStyles.case_studies_table, 'only-on-desktop')}>
                <tbody>
                    <tr>
                        <td>
                            <CaseStudyCard 
                                title='Case Study 1'
                                imageSrc='/code.png'
                                link="ABC"  
                                height={504}
                                width={1030} 
                                className={caseStudyCardStyle.scale_small_on_hover} 
                            />
                        </td>
                        <td>
                            <CaseStudyCard 
                                title='Case Study 1'
                                imageSrc='/code.png'
                                link="ABC"  
                                height={230}
                                width={500}   
                                className={caseStudyCardStyle.scale_normal_on_hover}  
                            />
                            <CaseStudyCard 
                                title='Case Study 1'
                                imageSrc='/code.png'
                                link="ABC"   
                                height={230}
                                width={500} 
                                className={classNames(caseStudyCardStyle.scale_normal_on_hover, 'margin-top-35px')}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div className='flex-row'>
                                <CaseStudyCard 
                                    title='Case Study 1'
                                    imageSrc='/code.png'
                                    link="ABC"   
                                    height={230}
                                    width={500} 
                                    className={caseStudyCardStyle.scale_normal_on_hover}  
                                />
                                <CaseStudyCard 
                                    title='Case Study 1'
                                    imageSrc='/code.png'
                                    link="ABC"   
                                    height={230}
                                    width={500} 
                                    className={classNames(caseStudyCardStyle.scale_normal_on_hover, 'margin-left-30px')}

                                />
                            </div>
                        </td>
                        <td>
                            <CaseStudyCard 
                                title='Case Study 1'
                                imageSrc='/code.png'
                                link="ABC"   
                                height={230}
                                width={500} 
                                className={caseStudyCardStyle.scale_normal_on_hover}  
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <div className={classNames(caseStudiesStyles.case_study_mobile_container, 'only-on-mobile')}>
                <CaseStudyCard 
                    title='Case Study 1'
                    imageSrc='/code.png'
                    link="ABC"   
                    height={230}
                    width={500} 
                />
                <CaseStudyCard 
                    title='Case Study 1'
                    imageSrc='/code.png'
                    link="ABC"   
                    height={230}
                    width={500}  
                />
                <CaseStudyCard 
                    title='Case Study 1'
                    imageSrc='/code.png'
                    link="ABC"   
                    height={230}
                    width={500} 
                />

            </div>
        </>
    )
}

export default CaseStudies;