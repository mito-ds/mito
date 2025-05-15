import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';


const App = (): JSX.Element => {
    return (
        <div>
            <h1>Settings Manager</h1>
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