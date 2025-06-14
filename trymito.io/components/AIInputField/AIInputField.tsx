/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import aiInputStyles from './AIInputField.module.css';
import { classNames } from '../../utils/classNames';
import { JUPYTERHUB_MITO_LINK } from '../CTAButtons/CTAButtons';

// LoadingCircle component
const LoadingCircle = (): JSX.Element => {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" opacity="0.25"/>
            <path 
                d="M8 1C11.866 1 15 4.13401 15 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            >
                <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="0 8 8"
                    to="360 8 8"
                    dur="1s"
                    repeatCount="indefinite"
                />
            </path>
        </svg>
    );
};

interface AIInputFieldProps {
    placeholder?: string;
    autoLaunchJupyterLab?: boolean;
    jupyterLabUrl?: string;
    showExamples?: boolean;
}

// Default example prompts
const DEFAULT_EXAMPLES = [
    "Plot Meta's acquisition impact on stock prices",
    "Analyze car crash fatalities by region",
    "Explore US trade surplus and deficits by country"
];

const AIInputField: React.FC<AIInputFieldProps> = ({
    placeholder = 'What analysis can I help you with?',
    autoLaunchJupyterLab = false,
    showExamples = true,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const setCookie = (name: string, value: string, hours: number = 24): void => {
        const date = new Date();
        date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        
        // Set cookie for all subdomains of trymito.io (production)
        document.cookie = `${name}=${value}; ${expires}; path=/; domain=.trymito.io; SameSite=Lax; Secure`;
        
        // For localhost development
        if (window.location.hostname === 'localhost') {
            document.cookie = `${name}=${value}; ${expires}; path=/`;
        }
    };

    const handleInputSubmit = (customInput?: string): void => {
        const submittedInput = (customInput || inputValue).trim();
        if (submittedInput !== '') {
            setIsGenerating(true);
            
            // Set the input value if using a custom input (from example button)
            if (customInput) {
                setInputValue(customInput);
            }
            
            // For production: Use cookies (persist through SSO flow)
            setCookie('mito-ai-first-message', submittedInput);
            
            if (autoLaunchJupyterLab) {
                // Navigate to launch.trymito.io (cookies will persist)
                window.location.href = JUPYTERHUB_MITO_LINK;
            } 
            
            // Simulate processing
            setTimeout(() => {
                setIsGenerating(false);
                setInputValue('');
            }, 2000);
        }
    };

    const handleExampleClick = (exampleText: string): void => {
        handleInputSubmit(exampleText);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        e.stopPropagation();
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        e.stopPropagation();
        
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInputSubmit();
        }
    };

    return (
        <div className={classNames(aiInputStyles.ai_input_field_wrapper)}>
            <div className={aiInputStyles.input_container}>
                <div className={classNames(aiInputStyles.input_wrapper, isGenerating ? aiInputStyles.generating : '')}>
                    <div className={aiInputStyles.input_icon_left}>
                        {isGenerating ? (
                            <LoadingCircle />
                        ) : (
                            <>✦</>
                        )}
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isGenerating ? 'Processing your request...' : placeholder}
                        className={aiInputStyles.prompt_input}
                        autoComplete="off"
                        spellCheck={false}
                        disabled={isGenerating}
                    />
                    <div className={aiInputStyles.input_icons_right}>
                        <button 
                            className={aiInputStyles.input_action_button}
                            onClick={() => handleInputSubmit()}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={isGenerating}
                        >
                            ▶
                        </button>
                    </div>
                </div>
            </div>
            
            {showExamples && (
                <div className={classNames(aiInputStyles.examples_container, isGenerating ? aiInputStyles.generating : '')}>
                    {DEFAULT_EXAMPLES.map((example, index) => (
                        <button
                            key={index}
                            className={aiInputStyles.example_button}
                            onClick={() => handleExampleClick(example)}
                            disabled={isGenerating}
                        >
                            {example}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AIInputField; 