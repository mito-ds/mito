import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import '../../../style/SettingsWidget.css';

const App = (): JSX.Element => {
    return (
        <div className="settings-widget">
            <h1>Mito AI Settings</h1>
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