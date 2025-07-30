/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import TextButton from '../../../components/TextButton';
import { logEvent } from '../../../restAPI/RestAPI';

interface RevertQuestionnaireProps {
    onDestroy: () => void;
}

const RevertQuestionnaire: React.FC<RevertQuestionnaireProps> = ({ onDestroy }) => {
    const CHOICES = [
        'The output didn’t run or gave the wrong result.',
        'The code didn’t match my intent.',
        'The code works, but it’s not readable or easy to follow.',
        'I realized I wanted to do something else.'
    ]

    const handleButtonClick = (choice: string) => {
        void logEvent('mito_ai_revert_questionnaire_choice', { 'reason': choice });
        onDestroy(); // Destroy the component when any button is clicked
    };

    return (
        <div>
            <p>What went wrong?</p>
            {CHOICES.map((choice) => (
                <>
                    <TextButton
                        text={choice}
                        onClick={() => handleButtonClick(choice)}
                        title={choice}
                        variant='purple'
                        width='block'
                        textAlign='left'
                        className="revert-questionnaire-button"
                    />
                    <br />
                </>
            ))}
        </div>
    );
};

export default RevertQuestionnaire;