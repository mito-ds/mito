import React, { useEffect, useState } from 'react';
import logoSection from './LogoSection.module.css'
import { log } from 'console';
import Image from 'next/image';

const RotatingLogo = ({ imgs, selectedIndex }: { imgs: { src: string, alt: string }[]; selectedIndex: number }): JSX.Element => {
    const [currentImg, setCurrentImg] = useState(imgs[selectedIndex]);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        setFade(false); // Start by fading out the current image
        const timeout = setTimeout(() => {
            setCurrentImg(imgs[selectedIndex]); // Update the image after fade out
            setFade(true); // Start fading in the new image
        }, 1000); // Timeout duration should match the CSS transition duration
        return () => clearTimeout(timeout);
    }, [selectedIndex, imgs]);

    return (
        <div className={logoSection.rotating_logo_container}>
            <img
                className={`${logoSection.logo} ${fade ? logoSection.show : ''}`}
                src={currentImg.src}
                alt={currentImg.alt}
                width={150}
            />
        </div>
    );
};


const LOGOS: {src: string, alt: string}[][] = [
    [
        {src: '/customers/accenture.png', alt: 'Accenture'},
        {src: '/customers/amazon.png', alt: 'Amazon'},
    ], 
    [
        {src: '/customers/cisco.png', alt: 'Cisco'},
        {src: '/customers/wayfair.png', alt: 'Wayfair'},
    ],
    [
        {src: '/customers/deloitte.png', alt: 'Deloitte'},
        {src: '/customers/pwc.png', alt: 'PWC'},
    ],
    [
        {src: '/customers/ericsson.png', alt: 'Ericsson'},
        {src: '/customers/kpmg.png', alt: 'KPMG'},
    ]
]


const LogoSection = (props: {}): JSX.Element => {
    const [selectedLogoArray, setSelectedLogoArray] = React.useState([0, 0, 0, 0]);

    // Randomly select a new image every 2.5 seconds
    useEffect(() => {
        const randomLogoIndex = Math.floor(Math.random() * 4);
        const timeout = setTimeout(() => {
            const newSelectedLogoArray = selectedLogoArray.map((_, i) => i === randomLogoIndex ? (selectedLogoArray[i] + 1) % LOGOS[i].length : selectedLogoArray[i]);
            setSelectedLogoArray(newSelectedLogoArray);
        }, 3000);
        return () => clearTimeout(timeout);
    }, [selectedLogoArray]);

    return (
        <div className={logoSection.container}>
            <h2>Trusted by dozens of fortune 500 companies</h2>
            <div className={logoSection.logos}>
                <RotatingLogo imgs={LOGOS[0]} selectedIndex={selectedLogoArray[0]} />
                <RotatingLogo imgs={LOGOS[1]} selectedIndex={selectedLogoArray[1]} />
                <RotatingLogo imgs={LOGOS[2]} selectedIndex={selectedLogoArray[2]} />
                <RotatingLogo imgs={LOGOS[3]} selectedIndex={selectedLogoArray[3]} />
            </div>
        </div>
    )
}

export default LogoSection;