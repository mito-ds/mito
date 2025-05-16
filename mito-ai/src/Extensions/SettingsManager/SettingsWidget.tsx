import React, { useState } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { DatabasePage } from './database/DatabasePage';
import '../../../style/SettingsWidget.css';

// Placeholder components - you can create these in separate files later
const GeneralSettings = () => <div>General Settings Content</div>;
const AdvancedSettings = () => <div>Advanced Settings Content</div>;

const TABS_CONFIG = {
    general: {
        label: 'General',
        component: GeneralSettings
    },
    database: {
        label: 'Database',
        component: DatabasePage
    },
    advanced: {
        label: 'Advanced',
        component: AdvancedSettings
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
                    <h2>Mito AI Settings</h2>
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