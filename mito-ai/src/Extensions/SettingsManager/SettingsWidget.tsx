/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { DatabasePage } from './database/DatabasePage';
import { SupportPage } from './support/SupportPage';
import { GeneralPage } from './general/GeneralPage';
import { RulesPage } from './rules/RulesPage';
import { VerifiedReportsPage, IVerifiedReportsDeepLink } from './verifiedReports/VerifiedReportsPage';
import { ProfilerPage } from './profiler/ProfilerPage';
import { SubscriptionPage } from './subscription/SubscriptionPage';
import { MCPPage } from './mcp/MCPPage';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import XMarkIcon from '../../icons/XMark';
import '../../../style/SettingsWidget.css';

type TabKey = 'general' | 'subscription' | 'database' | 'mcp' | 'rules' | 'verifiedReports' | 'profiler' | 'support';

const TABS_CONFIG = (contextManager: IContextManager, deepLink?: IVerifiedReportsDeepLink) => ({
    general: {
        label: 'General',
        component: GeneralPage
    },
    subscription: {
        label: 'Subscription',
        component: SubscriptionPage
    },
    database: {
        label: 'Database',
        component: DatabasePage
    },
    mcp: {
        label: 'MCP Servers',
        component: MCPPage
    },
    rules: {
        label: 'Rules',
        component: RulesPage
    },
    verifiedReports: {
        label: 'Verified Reports',
        component: () => <VerifiedReportsPage deepLink={deepLink} />
    },
    profiler: {
        label: 'Profiler',
        component: () => <ProfilerPage contextManager={contextManager} />
    },
    support: {
        label: 'Support',
        component: SupportPage
    },

}) as const;

interface AppProps {
    contextManager: IContextManager;
    initialTab?: TabKey;
    deepLink?: IVerifiedReportsDeepLink;
    onClose: () => void;
}

const App = ({ contextManager, initialTab = 'general', deepLink, onClose }: AppProps): JSX.Element => {
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
    const tabsConfig = TABS_CONFIG(contextManager, deepLink);

    const renderContent = (): JSX.Element => {
        const TabComponent = tabsConfig[activeTab].component;
        return <TabComponent />;
    };

    return (
        <div className="settings-widget">
            <button
                type="button"
                className="settings-close-button"
                aria-label="Close settings"
                title="Close"
                onClick={onClose}
            >
                <XMarkIcon fill="currentColor" width="14" height="14" />
            </button>
            <div className="settings-layout">
                <div className="settings-sidebar">
                    <nav>
                        <ul>
                            {Object.entries(tabsConfig).map(([key, { label }]) => (
                                <li
                                    key={key}
                                    className={activeTab === key ? 'active' : ''}
                                    onClick={() => setActiveTab(key as TabKey)}
                                >
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
                <div className="settings-main">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export class SettingsWidget extends ReactWidget {
    private contextManager: IContextManager;
    private initialTab?: TabKey;
    private deepLink?: IVerifiedReportsDeepLink;
    private onClose: () => void;

    constructor(
        contextManager: IContextManager,
        initialTab?: TabKey,
        onClose?: () => void,
        deepLink?: IVerifiedReportsDeepLink,
    ) {
        super();
        this.contextManager = contextManager;
        this.initialTab = initialTab;
        this.deepLink = deepLink;
        this.onClose = onClose ?? (() => undefined);
        this.addClass('jp-ReactWidget');
    }

    render(): JSX.Element {
        return (
            <App
                contextManager={this.contextManager}
                initialTab={this.initialTab}
                deepLink={this.deepLink}
                onClose={this.onClose}
            />
        );
    }
}