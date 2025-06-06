/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import aiInputStyles from './AIInputField.module.css';
import { classNames } from '../../utils/classNames';

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
    className?: string;
    placeholder?: string;
    autoLaunchJupyterLab?: boolean;
    jupyterLabUrl?: string;
}

const AIInputField: React.FC<AIInputFieldProps> = ({
    className,
    placeholder = 'What analysis can I help you with?',
    autoLaunchJupyterLab = false,
    jupyterLabUrl = 'http://localhost:8889/lab?token=73ee8fa776ffa345be9559cc6bb2bf1ebe68fcf7d0b9501e'
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleInputSubmit = (): void => {
        const submittedInput = inputValue.trim();
        if (submittedInput !== '') {
            setIsGenerating(true);
            
            // Encode the message for URL
            const encodedMessage = encodeURIComponent(submittedInput);
            
            // Create URL with message parameter
            const separator = jupyterLabUrl.includes('?') ? '&' : '?';
            const jupyterLabUrlWithMessage = `${jupyterLabUrl}${separator}mito-ai-first-message=${encodedMessage}`;
            
            if (autoLaunchJupyterLab) {
                // Automatically launch JupyterLab with the message in the URL
                window.open(jupyterLabUrlWithMessage, '_blank');
                console.log('🚀 Launching JupyterLab with message in URL');
            } else {
                // Log for manual use
                console.log('📋 Copy this URL to launch JupyterLab with your message:');
                console.log(jupyterLabUrlWithMessage);
            }
            
            // Simulate processing
            setTimeout(() => {
                setIsGenerating(false);
                setInputValue('');
            }, 2000);
        }
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
        <div className={classNames(aiInputStyles.input_container, className)}>
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
                        onClick={handleInputSubmit}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={isGenerating}
                    >
                        ▶
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIInputField; 