import planBulletStyles from './PlanBullet.module.css'
import Image from 'next/image'


import Checkmark from '../../public/Checkmark.png'


const PlanBullet = (props: {children: JSX.Element}): JSX.Element => {

    return (
        <div className={planBulletStyles.plan_bullet_container + ' flex-row'}> 
            <div className={planBulletStyles.checkmark_container}>
                <Image 
                    src={Checkmark}
                    alt='checkmark'
                />
            </div>
            <div className={planBulletStyles.text_container}>
                {props.children}
            </div>
        </div>
    )
}

export default PlanBullet; 