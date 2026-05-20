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
import { ProfilerPage } from './profiler/ProfilerPage';
import { SubscriptionPage } from './subscription/SubscriptionPage';
import { MCPPage } from './mcp/MCPPage';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import XMarkIcon from '../../icons/XMark';
import '../../../style/SettingsWidget.css';

const TABS_CONFIG = (contextManager: IContextManager) => ({
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
    initialTab?: keyof ReturnType<typeof TABS_CONFIG>;
    onClose: () => void;
}

const App = ({ contextManager, initialTab = 'general', onClose }: AppProps): JSX.Element => {
    const [activeTab, setActiveTab] = useState<keyof ReturnType<typeof TABS_CONFIG>>(initialTab);
    const tabsConfig = TABS_CONFIG(contextManager);

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
                                    onClick={() => setActiveTab(key as keyof ReturnType<typeof TABS_CONFIG>)}
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
    private initialTab?: keyof ReturnType<typeof TABS_CONFIG>;
    private onClose: () => void;

    constructor(
        contextManager: IContextManager,
        initialTab?: keyof ReturnType<typeof TABS_CONFIG>,
        onClose?: () => void
    ) {
        super();
        this.contextManager = contextManager;
        this.initialTab = initialTab;
        this.onClose = onClose ?? (() => undefined);
        this.addClass('jp-ReactWidget');
    }

    render(): JSX.Element {
        return (
            <App
                contextManager={this.contextManager}
                initialTab={this.initialTab}
                onClose={this.onClose}
            />
        );
    }
}