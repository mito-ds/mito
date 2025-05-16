import React, { useState } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { DatabasePage } from './database/DatabasePage';
import { SupportPage } from './support/SupportPage';
import '../../../style/SettingsWidget.css';

const TABS_CONFIG = {
    database: {
        label: 'Database',
        component: DatabasePage
    },
    support: {
        label: 'Support',
        component: SupportPage
    }
} as const;

const App = (): JSX.Element => {
    const [activeTab, setActiveTab] = useState<keyof typeof TABS_CONFIG>('database');

    const renderContent = () => {
        const TabComponent = TABS_CONFIG[activeTab].component;
        return <TabComponent />;
    };

    return (
        <div className="settings-widget">
            <div className="settings-layout">
                <div className="settings-sidebar">
                    <nav>
                        <ul>
                            {Object.entries(TABS_CONFIG).map(([key, { label }]) => (
                                <li
                                    key={key}
                                    className={activeTab === key ? 'active' : ''}
                                    onClick={() => setActiveTab(key as keyof typeof TABS_CONFIG)}
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
    constructor() {
        super();
        this.addClass('jp-ReactWidget');
    }

    render(): JSX.Element {
        return <App />;
    }
}