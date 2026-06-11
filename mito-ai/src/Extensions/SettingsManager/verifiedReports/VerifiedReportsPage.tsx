/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    deleteVerifiedReport,
    deleteVerifiedSnippet,
    getVerifiedReport,
    getVerifiedReports,
    setVerifiedReport,
    updateVerifiedSnippet,
    VerifiedReport,
    VerifiedReportListItem,
    VerifiedSnippet,
} from '../../../restAPI/RestAPI';
import VerifiedShieldIcon from '../../../icons/VerifiedShieldIcon';
import { slugifyRuleName } from '../../../utils/fileName';
import '../../../../style/button.css';
import '../../../../style/SettingsPage.css';
import '../../../../style/VerifiedReportsPage.css';

export interface IVerifiedReportsDeepLink {
    reportName?: string;
    snippetId?: string;
}

interface IVerifiedReportsPageProps {
    deepLink?: IVerifiedReportsDeepLink;
}

export const VerifiedReportsPage = ({ deepLink }: IVerifiedReportsPageProps): JSX.Element => {
    const [reports, setReports] = useState<VerifiedReportListItem[]>([]);
    const [selectedReport, setSelectedReport] = useState<VerifiedReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newReportName, setNewReportName] = useState('');
    const [newReportDescription, setNewReportDescription] = useState('');
    const [highlightedSnippetId, setHighlightedSnippetId] = useState<string | undefined>();
    const snippetRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const fetchReports = async (): Promise<void> => {
        try {
            const reportsList = await getVerifiedReports();
            setReports(reportsList.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const loadReport = useCallback(async (reportName: string): Promise<void> => {
        try {
            const report = await getVerifiedReport(reportName);
            setSelectedReport(report);
            setIsCreating(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load report');
        }
    }, []);

    useEffect(() => {
        void fetchReports();
    }, []);

    useEffect(() => {
        if (deepLink?.reportName) {
            void loadReport(deepLink.reportName);
            if (deepLink.snippetId) {
                setHighlightedSnippetId(deepLink.snippetId);
            }
        }
    }, [deepLink, loadReport]);

    useEffect(() => {
        if (highlightedSnippetId && snippetRefs.current[highlightedSnippetId]) {
            snippetRefs.current[highlightedSnippetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const timeout = setTimeout(() => setHighlightedSnippetId(undefined), 3000);
            return () => clearTimeout(timeout);
        }
        return undefined;
    }, [highlightedSnippetId, selectedReport]);

    const handleCreateReport = async (): Promise<void> => {
        const slugifiedName = slugifyRuleName(newReportName);
        if (!slugifiedName) {
            setError('Report name is required.');
            return;
        }
        try {
            await setVerifiedReport(slugifiedName, newReportDescription);
            setNewReportName('');
            setNewReportDescription('');
            setIsCreating(false);
            await fetchReports();
            await loadReport(slugifiedName);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create report');
        }
    };

    const handleDeleteReport = async (reportName: string): Promise<void> => {
        if (!window.confirm(`Delete verified report "${reportName}"?`)) {
            return;
        }
        try {
            await deleteVerifiedReport(reportName);
            if (selectedReport?.name === reportName) {
                setSelectedReport(null);
            }
            await fetchReports();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete report');
        }
    };

    const handleUpdateDescription = async (): Promise<void> => {
        if (!selectedReport) {
            return;
        }
        try {
            await setVerifiedReport(selectedReport.name, selectedReport.description);
            await fetchReports();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update description');
        }
    };

    const handleUpdateSnippet = async (snippet: VerifiedSnippet): Promise<void> => {
        if (!selectedReport) {
            return;
        }
        try {
            await updateVerifiedSnippet(selectedReport.name, snippet.id, {
                comment: snippet.comment,
                ai_context: snippet.ai_context,
            });
            await loadReport(selectedReport.name);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update snippet');
        }
    };

    const handleDeleteSnippet = async (snippetId: string): Promise<void> => {
        if (!selectedReport) {
            return;
        }
        if (!window.confirm('Delete this verified snippet?')) {
            return;
        }
        try {
            await deleteVerifiedSnippet(selectedReport.name, snippetId);
            await loadReport(selectedReport.name);
            await fetchReports();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete snippet');
        }
    };

    const formatSnippetDate = (dateString: string): string =>
        new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

    return (
        <div className="verified-reports-page">
            <div className="settings-header verified-reports-header">
                <div className="verified-reports-header-title">
                    <span className="verified-reports-header-icon" aria-hidden="true">
                        <VerifiedShieldIcon />
                    </span>
                    <h2>Verified Reports</h2>
                </div>
                <button
                    type="button"
                    className="button-base button-purple"
                    onClick={() => {
                        setIsCreating(true);
                        setSelectedReport(null);
                    }}
                >
                    <b>＋ New Report</b>
                </button>
            </div>
            <p className="settings-page-muted-description">
                Save annotated code snippets your team has verified. The agent reads these reports on demand and
                cites them when it reuses your verified approaches.
            </p>

            {error && <p className="error">{error}</p>}

            <div className="verified-reports-layout">
                <div className="verified-reports-list">
                    <div className="verified-reports-list-header">Reports</div>
                    {isCreating && (
                        <div className="verified-reports-create-form">
                            <input
                                type="text"
                                placeholder="Report name"
                                value={newReportName}
                                onChange={(e) => setNewReportName(e.target.value)}
                            />
                            <textarea
                                placeholder="What can the agent learn from this report?"
                                value={newReportDescription}
                                onChange={(e) => setNewReportDescription(e.target.value)}
                                rows={3}
                            />
                            <div className="verified-reports-create-actions">
                                <button type="button" className="button-base button-purple" onClick={() => void handleCreateReport()}>
                                    Create
                                </button>
                                <button type="button" className="button-base button-gray" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {reports.length === 0 && !isCreating ? (
                        <div className="empty-state">
                            <p>
                                No verified reports yet. Select code in a notebook and click
                                &quot;Add Verified Snippet&quot;, or create a report here.
                            </p>
                        </div>
                    ) : (
                        <ul className="verified-reports-list-items">
                            {reports.map(report => (
                                <li
                                    key={report.name}
                                    className={selectedReport?.name === report.name ? 'active' : ''}
                                    onClick={() => void loadReport(report.name)}
                                >
                                    <div className="verified-reports-list-item-name">{report.name}</div>
                                    {report.description && (
                                        <div className="verified-reports-list-item-description">{report.description}</div>
                                    )}
                                    <div className="verified-reports-list-item-meta">
                                        <span className="verified-reports-snippet-badge">
                                            {report.snippetCount} snippet{report.snippetCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="verified-reports-detail">
                    {selectedReport ? (
                        <div className="verified-reports-detail-panel">
                            <div className="verified-reports-detail-header">
                                <div>
                                    <h3>{selectedReport.name}</h3>
                                    <div className="verified-reports-detail-header-meta">
                                        {selectedReport.snippets.length} verified snippet
                                        {selectedReport.snippets.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="verified-reports-text-btn verified-reports-text-btn--danger"
                                    onClick={() => void handleDeleteReport(selectedReport.name)}
                                >
                                    Delete report
                                </button>
                            </div>

                            <div className="verified-reports-section">
                                <label className="verified-reports-field-label" htmlFor="verified-report-description">
                                    Description
                                </label>
                                <textarea
                                    id="verified-report-description"
                                    className="verified-reports-description-input"
                                    value={selectedReport.description}
                                    onChange={(e) => setSelectedReport({ ...selectedReport, description: e.target.value })}
                                    onBlur={() => void handleUpdateDescription()}
                                    rows={2}
                                    placeholder="What can the agent learn from this report?"
                                />
                            </div>

                            <div className="verified-reports-section">
                                <div className="verified-reports-section-header">
                                    <h4>Snippets</h4>
                                </div>
                                {selectedReport.snippets.length === 0 ? (
                                    <p className="verified-reports-empty">
                                        No snippets yet. Select code in a notebook and click &quot;Add Verified Snippet&quot;.
                                    </p>
                                ) : (
                                    selectedReport.snippets.map(snippet => (
                                        <div
                                            key={snippet.id}
                                            ref={(el) => { snippetRefs.current[snippet.id] = el; }}
                                            className={`verified-snippet-card ${highlightedSnippetId === snippet.id ? 'highlighted' : ''}`}
                                        >
                                            <div className="verified-snippet-card-header">
                                                <span className="verified-snippet-date" title={`Snippet ID: ${snippet.id}`}>
                                                    Added {formatSnippetDate(snippet.created_at)}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="verified-reports-text-btn verified-reports-text-btn--danger"
                                                    onClick={() => void handleDeleteSnippet(snippet.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                            <div className="verified-snippet-code-block">
                                                <div className="verified-snippet-code-label">Code</div>
                                                <pre className="verified-snippet-code">{snippet.code}</pre>
                                            </div>
                                            <div className="verified-snippet-card-fields">
                                                <div>
                                                    <label className="verified-reports-field-label" htmlFor={`snippet-comment-${snippet.id}`}>
                                                        Your comment
                                                    </label>
                                                    <textarea
                                                        id={`snippet-comment-${snippet.id}`}
                                                        className="verified-reports-textarea"
                                                        value={snippet.comment}
                                                        onChange={(e) => {
                                                            setSelectedReport({
                                                                ...selectedReport,
                                                                snippets: selectedReport.snippets.map(s =>
                                                                    s.id === snippet.id ? { ...s, comment: e.target.value } : s
                                                                ),
                                                            });
                                                        }}
                                                        onBlur={() => {
                                                            const current = selectedReport.snippets.find(s => s.id === snippet.id);
                                                            if (current) {
                                                                void handleUpdateSnippet(current);
                                                            }
                                                        }}
                                                        rows={2}
                                                        placeholder="Explain why this approach is verified"
                                                    />
                                                </div>
                                                <div className="verified-reports-field--ai">
                                                    <label className="verified-reports-field-label" htmlFor={`snippet-ai-${snippet.id}`}>
                                                        AI-generated context
                                                    </label>
                                                    <textarea
                                                        id={`snippet-ai-${snippet.id}`}
                                                        className="verified-reports-textarea verified-reports-textarea--ai"
                                                        value={snippet.ai_context}
                                                        onChange={(e) => {
                                                            setSelectedReport({
                                                                ...selectedReport,
                                                                snippets: selectedReport.snippets.map(s =>
                                                                    s.id === snippet.id ? { ...s, ai_context: e.target.value } : s
                                                                ),
                                                            });
                                                        }}
                                                        onBlur={() => {
                                                            const current = selectedReport.snippets.find(s => s.id === snippet.id);
                                                            if (current) {
                                                                void handleUpdateSnippet(current);
                                                            }
                                                        }}
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="verified-reports-empty-panel">
                            <span className="verified-reports-empty-panel-icon" aria-hidden="true">
                                <VerifiedShieldIcon />
                            </span>
                            <p>Select a report to view its verified snippets.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
