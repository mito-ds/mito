/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { COMMAND_MITO_AI_SETTINGS } from '../SettingsManager/SettingsManagerPlugin';
import '../../../style/CTACarousel.css';

interface CTACarouselProps {
    app: JupyterFrontEnd;
}

const CTACarousel: React.FC<CTACarouselProps> = ({ app }) => {
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
                        data-testid="cta-carousel-button"
                    >
                        <b>＋ Add Database</b>
                    </button>
                </span>
            )
        },
        {
            content: <span>Use Agent mode to let the AI write and execute cells on your behalf.</span>
        },
        {
            content: <span>Use @ to reference your variables, files, rules, and more.</span>
        }
    ];

    const currentMessage = CTACAROUSEL_MESSAGES[Math.min(currentIndex, CTACAROUSEL_MESSAGES.length - 1)]!.content;

    return (
        <div className="cta-carousel">
            <div className="cta-carousel-container">
                <div className="cta-message" data-testid="cta-message">
                    {currentMessage}
                </div>
            </div>
            <div className="cta-carousel-dots">
                {CTACAROUSEL_MESSAGES.map((_, index) => (
                    <div
                        key={index}
                        className={`cta-carousel-dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                        data-testid="cta-carousel-dot"
                        role="button"
                    />
                ))}
            </div>
        </div>
    );
};

export default CTACarousel;
