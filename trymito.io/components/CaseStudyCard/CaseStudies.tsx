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
                                imageSrc='/case-studies/Top 10 bank automated critical monthly reports.png'
                                link="blog/wealth-management-analyst-automates-critical-monthly-deliverable"  
                                height={504}
                                width={1030} 
                                className={caseStudyCardStyle.scale_small_on_hover} 
                            />
                        </td>
                        <td>
                            <CaseStudyCard 
                                imageSrc='/case-studies/special events.png'
                                link="/blog/special-events-team-at-large-asset-manager-saves-7-hours-week-using-mito"  
                                height={230}
                                width={500}   
                                className={caseStudyCardStyle.scale_normal_on_hover}  
                            />
                            <CaseStudyCard 
                                imageSrc='/case-studies/recon.png'
                                link="blog/medicare-agency-cuts-recon-process-from-19-to-2-days-using-mito"   
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
                                    imageSrc='/case-studies/python training.png'
                                    link="blog/automating-spreadsheets-with-python-101"   
                                    height={230}
                                    width={500} 
                                    className={caseStudyCardStyle.scale_normal_on_hover}  
                                />
                                <CaseStudyCard 
                                    imageSrc='/case-studies/common mistakes.png'
                                    link="blog/10-mistakes-to-look-out-for-when-transitioning-from-excel-to-python"   
                                    height={230}
                                    width={500} 
                                    className={classNames(caseStudyCardStyle.scale_normal_on_hover, 'margin-left-30px')}

                                />
                            </div>
                        </td>
                        <td>
                            <CaseStudyCard 
                                imageSrc='/case-studies/enigma.png'
                                link="blog/enigma-case-study"   
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
                    imageSrc='/case-studies/Top 10 bank automated critical monthly reports.png'
                    link="blog/wealth-management-analyst-automates-critical-monthly-deliverable"
                    height={230}
                    width={500} 
                />
                <CaseStudyCard 
                    imageSrc='/case-studies/special events.png'
                    link="/blog/special-events-team-at-large-asset-manager-saves-7-hours-week-using-mito"  
                    height={230}
                    width={500}  
                />
                <CaseStudyCard 
                    imageSrc='/case-studies/recon.png'
                    link="blog/medicare-agency-cuts-recon-process-from-19-to-2-days-using-mito"   
                    height={230}
                    width={500} 
                />
            </div>
        </>
    )
}

export default CaseStudies;