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
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import '../../../style/SettingsWidget.css';

const TABS_CONFIG = (contextManager: IContextManager) => ({
    database: {
        label: 'Database',
        component: DatabasePage
    },
    general: {
        label: 'General',
        component: GeneralPage
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
}

const App = ({ contextManager }: AppProps): JSX.Element => {
    const [activeTab, setActiveTab] = useState<keyof ReturnType<typeof TABS_CONFIG>>('database');
    const tabsConfig = TABS_CONFIG(contextManager);

    const renderContent = (): JSX.Element => {
        const TabComponent = tabsConfig[activeTab].component;
        return <TabComponent />;
    };

    return (
        <div className="settings-widget">
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

    constructor(contextManager: IContextManager) {
        super();
        this.contextManager = contextManager;
        this.addClass('jp-ReactWidget');
    }

    render(): JSX.Element {
        return <App contextManager={this.contextManager} />;
    }
}