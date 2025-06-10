import React, { useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../utils/user';
import { COMMAND_MITO_AI_SETTINGS } from '../SettingsManager/SettingsManagerPlugin';

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
                    Talk to your database. No SQL required.
                    <br />
                    <button
                        className="button-base button-purple"
                        onClick={() => app.commands.execute(COMMAND_MITO_AI_SETTINGS)}
                        style={{ marginTop: '8px' }}
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
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '56px',
                }}
            >
                <div
                    className="cta-message"
                    style={{
                        display: 'block',
                        textAlign: 'center',
                        marginBottom: '15px',
                        opacity: 1,
                        transition: 'opacity 0.5s ease-in-out',
                        flex: 1,
                        fontSize: '0.95rem',
                        lineHeight: 1.3,
                        minHeight: '2.5em',
                        padding: '0 8px',
                    }}
                >
                    {currentMessage}
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                {resolvedMessages.map((_, index) => (
                    <div
                        key={index}
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: index === currentIndex ? 'var(--purple-500)' : 'var(--jp-layout-color3)',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease',
                            boxSizing: 'border-box',
                        }}
                        onClick={() => setCurrentIndex(index)}
                        title={`Go to message ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default CTACarousel;
