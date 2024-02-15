import React, { useEffect } from 'react';
import logoSection from './LogoSection.module.css'
import { log } from 'console';

const RotatingLogo = (props: {imgs: {src: string, alt: string}[]}): JSX.Element => {
    const [currentImg, setCurrentImg] = React.useState(0);

    useEffect(() => {
        const randomDelay = Math.max(Math.random() * 5000 + 2500, 2500);
        const timeout = setTimeout(() => {
            console.log('setting current img', currentImg);
            setCurrentImg((currentImg + 1) % props.imgs.length);
        }, randomDelay);
        return () => clearTimeout(timeout);
    }, [currentImg]);

    // Force image to a fixed size, so that the container doesn't resize when the image changes
    return (
        <div className={logoSection.rotating_logo_container}>
            <img className={logoSection.logo} src={props.imgs[currentImg].src} alt={props.imgs[currentImg].alt} width={150}/>
        </div>
    )
}


const LogoSection = (props: {}): JSX.Element => {
    return (
        <div className={logoSection.container}>
            <h2>Trusted by dozens of fortune 500 companies</h2>
            <div className={logoSection.logos}>
                <RotatingLogo imgs={[
                    {src: '/customers/accenture.png', alt: 'Accenture'},
                    {src: '/customers/amazon.png', alt: 'Amazon'},
                ]}/>
                <RotatingLogo imgs={[
                    {src: '/customers/cisco.png', alt: 'Accenture'},
                    {src: '/customers/wayfair.png', alt: 'Amazon'},
                ]}/>
                <RotatingLogo imgs={[
                    {src: '/customers/deloitte.png', alt: 'Accenture'},
                    {src: '/customers/pwc.png', alt: 'Amazon'},
                ]}/>
                <RotatingLogo imgs={[
                    {src: '/customers/ericsson.png', alt: 'Accenture'},
                    {src: '/customers/kpmg.png', alt: 'Amazon'},
                ]}/>
            </div>
        </div>
    )
}

export default LogoSection;