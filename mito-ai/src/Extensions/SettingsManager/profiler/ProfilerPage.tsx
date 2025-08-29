/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';

interface ProfilerPageProps {
    contextManager: IContextManager;
}

// Simple event system for capturing completion requests
export const captureCompletionRequest = (request: any): void => {
    const event = new CustomEvent('mito-ai-capture-request', {
        detail: {
            request,
            timestamp: new Date().toISOString()
        }
    });
    window.dispatchEvent(event);
};

export const ProfilerPage = ({ contextManager }: ProfilerPageProps): JSX.Element => {

    const [showContents, setShowContents] = useState<boolean>(true);
    const [capturedRequests, setCapturedRequests] = useState<any[]>([]);

    const handleRefreshContextManager = (): void => {
        // Force a re-render by toggling the state
        setShowContents(false);
        setTimeout(() => setShowContents(true), 0);
    };

    const copyContextManagerToClipboard = async (): Promise<void> => {
        const jsonContent = JSON.stringify({
            variables: contextManager.variables,
            files: contextManager.files
        }, null, 2);

        try {
            await navigator.clipboard.writeText(jsonContent);
            console.log('Context Manager contents copied to clipboard');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    // Listen for captured completion requests
    useEffect(() => {
        const handleCapturedRequest = (event: CustomEvent) => {
            setCapturedRequests(prev => [event.detail, ...prev]);
        };

        window.addEventListener('mito-ai-capture-request', handleCapturedRequest as EventListener);

        return () => {
            window.removeEventListener('mito-ai-capture-request', handleCapturedRequest as EventListener);
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
            <div className="settings-header">
                <h2>Profiler</h2>
            </div>

            <p style={{ color: 'red' }}>The profiler is a tool for debugging Mito AI internally.</p>

            <h3>Context Manager</h3>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button
                    className="button-base"
                    onClick={handleRefreshContextManager}
                >
                    Refresh
                </button>
                <button
                    className="button-base"
                    onClick={copyContextManagerToClipboard}
                >
                    Copy
                </button>
            </div>

            {showContents && (
                <div className="settings-option">
                    <pre style={{
                        overflowY: 'auto',
                        padding: '10px',
                        marginTop: '10px',
                        // backgroundColor: '#f5f5f5',
                    }}>
                        {JSON.stringify({
                            variables: contextManager.variables,
                            files: contextManager.files
                        }, null, 2)}
                    </pre>
                </div>
            )}

            <h3>Captured Completion Requests</h3>

            <button
                className="button-base"
                onClick={clearCapturedRequests}
            >
                Clear Captured Requests
            </button>

            {capturedRequests.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                    No requests captured yet. Send a message in the AI chat to see captured requests here.
                </p>
            ) : (
                capturedRequests.map((captured, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <h4>Request {capturedRequests.length - index} - {captured.timestamp}</h4>
                            <button
                                className="button-base"
                                onClick={() => copyRequestToClipboard(captured.request)}
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                                Copy
                            </button>
                        </div>
                        <pre style={{
                            overflowY: 'auto',
                            padding: '10px',
                            marginTop: '10px',
                        }}>
                            {JSON.stringify(captured.request, null, 2)}
                        </pre>
                    </div>
                ))
            )}
        </div>
    );
};
