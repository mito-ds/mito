/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';
import { ContextManagerSection } from './ContextManagerSection';
import { CapturedRequestsSection } from './CapturedRequestsSection';
import { EVENT_NAMES } from '../../../utils/constants';
import { getSetting, updateSettings } from '../../../restAPI/RestAPI';
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
    const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean>(false);

    // When we first open the page, check if the user has already accepted the disclaimer
    useEffect(() => {
        const checkDisclaimerStatus = async (): Promise<void> => {
            try {
                const disclaimerAccepted = await getSetting('profiler_disclaimer_accepted');
                setHasAcceptedDisclaimer(disclaimerAccepted === 'true');
            } catch (error) {
                console.error('Error checking disclaimer status:', error);
                // If there's an error, default to showing the disclaimer
                setHasAcceptedDisclaimer(false);
            }
        };
        void checkDisclaimerStatus();
    }, []);

    const handleAcceptDisclaimer = async (): Promise<void> => {
        try {
            await updateSettings('profiler_disclaimer_accepted', 'true');
            setHasAcceptedDisclaimer(true);
        } catch (error) {
            console.error('Error accepting disclaimer:', error);
        }
    };

    // Show disclaimer if not yet accepted
    if (!hasAcceptedDisclaimer) {
        return (
            <div>
                <div className="settings-header">
                    <h2>Profiler</h2>
                </div>
                <p>The profiler is an internal debugging tool intended for use by the Mito development team. It is not designed, tested, or supported for general usage. Running the profiler may impact performance, produce unstable behavior, or generate incomplete results. Use at your own discretion.</p>
                <button
                    className="button-base button-gray"
                    onClick={handleAcceptDisclaimer}
                >
                    Accept
                </button>
            </div>
        );
    }

    // Show the actual profiler content after disclaimer is accepted
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
