/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';
import { ContextManagerSection } from './ContextManagerSection';
import { CapturedRequestsSection } from './CapturedRequestsSection';
import { EVENT_NAMES } from '../../../utils/constants';
import '../../../../style/ProfilerPage.css';

interface ProfilerPageProps {
    contextManager: IContextManager;
}

// Simple event system for capturing completion requests.
// These events are usually variables that are not stored in the context manager,
// and are created dynamically. So we capture them before they are sent to the backend.
export const captureCompletionRequest = (request: any): void => {
    const event = new CustomEvent(EVENT_NAMES.MITO_AI_CAPTURE_REQUEST, {
        detail: {
            request,
        }
    });
    window.dispatchEvent(event);
};

export const ProfilerPage = ({ contextManager }: ProfilerPageProps): JSX.Element => {
    return (
        <div>
            <div className="settings-header">
                <h2>Profiler</h2>
            </div>

            <p className="profiler-warning">For internal debugging only.</p>

            <ContextManagerSection contextManager={contextManager} />

            <CapturedRequestsSection />
        </div>
    );
};
