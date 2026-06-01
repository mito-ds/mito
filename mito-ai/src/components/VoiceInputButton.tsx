/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import IconButton from './IconButton';
import MicrophoneOutlineIcon from '../icons/MicrophoneOutlineIcon';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { classNames } from '../utils/classNames';
import '../../style/VoiceInputButton.css';

interface VoiceInputButtonProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, disabled = false }) => {
    const { isListening, isSupported, toggleListening } = useSpeechToText(onTranscript);

    if (!isSupported) {
        return null;
    }

    return (
        <IconButton
            icon={<MicrophoneOutlineIcon />}
            title={isListening ? 'Stop dictation' : 'Dictate message'}
            disabled={disabled}
            onClick={toggleListening}
            className={classNames('icon-button-hover', 'voice-input-button', {
                'voice-input-button--listening': isListening,
            })}
        />
    );
};

export default VoiceInputButton;
