import React, { useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../utils/user';
import { COMMAND_MITO_AI_SETTINGS } from '../SettingsManager/SettingsManagerPlugin';
import '../../../style/CTACarousel.css';

interface CTACarouselProps {
    app: JupyterFrontEnd;
    operatingSystem: OperatingSystem;
}

const CTACarousel: React.FC<CTACarouselProps> = ({ app, operatingSystem }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Define messages inside component to access app prop
    const CTACAROUSEL_MESSAGES = [
        {
            content: (
                <span>
                    Generate more than just Python code. Talk to your database, no SQL required.
                    <br />
                    <button
                        className="button-base button-gray cta-carousel-button"
                        onClick={() => app.commands.execute(COMMAND_MITO_AI_SETTINGS)}
                    >
                        <b>＋ Add Database</b>
                    </button>
                </span>
            )
        },
        {
            content: (os: OperatingSystem) => <span>Use {os === 'mac' ? '⌘' : 'CTRL'} + Y to preview code suggestions.</span>
        },
        {
            content: <span>You can use @ to reference variables, columns in a dataframe, and more.</span>
        }
    ];

    // Resolve message content (supporting both ReactNode and function for OS-specific messages)
    const resolvedMessages = CTACAROUSEL_MESSAGES.map(msg =>
        typeof msg.content === 'function' ? msg.content(operatingSystem) : msg.content
    );
    const currentMessage = resolvedMessages[currentIndex] ?? resolvedMessages[0];

    return (
        <div className="cta-carousel">
            <div className="cta-carousel-container">
                <div className="cta-message">
                    {currentMessage}
                </div>
            </div>
            <div className="cta-carousel-dots">
                {resolvedMessages.map((_, index) => (
                    <div
                        key={index}
                        className={`cta-carousel-dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CTACarousel;
