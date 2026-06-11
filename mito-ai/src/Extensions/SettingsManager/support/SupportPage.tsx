/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { SettingsPageHeader } from '../SettingsPageHeader';
import QuestionIcon from '../../../icons/QuestionIcon';

export const SupportPage = (): JSX.Element => {
    return (
        <div>
            <SettingsPageHeader icon={<QuestionIcon />} title="Support" />
            <p>To learn more about Mito AI, please visit our <a href="https://docs.trymito.io/" target="_blank" rel="noopener noreferrer">documentation</a>.</p>
            <p>Additional support is available by emailing <a href="mailto:founders@sagacollab.com">founders@sagacollab.com</a></p>
        </div>
    );
};
