/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { EVENT_NAMES } from '../../../utils/constants';

export const CapturedRequestsSection = (): JSX.Element => {
    const [capturedRequests, setCapturedRequests] = useState<any[]>([]);

    // Listen for captured completion requests
    useEffect(() => {
        const handleCapturedRequest = (event: CustomEvent): void => {
            setCapturedRequests(prev => [event.detail, ...prev]);
        };

        window.addEventListener(EVENT_NAMES.MITO_AI_CAPTURE_REQUEST, handleCapturedRequest as EventListener);

        return () => {
            window.removeEventListener(EVENT_NAMES.MITO_AI_CAPTURE_REQUEST, handleCapturedRequest as EventListener);
        };
    }, []);

    const clearCapturedRequests = (): void => {
        setCapturedRequests([]);
    };

    const copyRequestToClipboard = async (request: any): Promise<void> => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(request, null, 2));
            console.log('Request copied to clipboard');
        } catch (err) {
            console.error('Failed to copy request to clipboard:', err);
        }
    };

    return (
        <div>
            <h3>Captured Completion Requests</h3>

            <button
                className="button-base profiler-clear-button"
                onClick={clearCapturedRequests}
            >
                Clear Captured Requests
            </button>

            {capturedRequests.length === 0 ? (
                <p className="profiler-no-requests">
                    No requests captured yet. Send a message in the AI chat to see captured requests here.
                </p>
            ) : (
                capturedRequests.map((captured, index) => (
                    <div key={index} className="profiler-request-container">
                        <div className="profiler-request-header">
                            <h4>{capturedRequests.length - index}</h4>
                            <button
                                className="button-base profiler-copy-button"
                                onClick={() => copyRequestToClipboard(captured.request)}
                            >
                                Copy
                            </button>
                        </div>
                        <pre className="json-container">
                            {JSON.stringify(captured.request, null, 2)}
                        </pre>
                    </div>
                ))
            )}
        </div>
    );
};
