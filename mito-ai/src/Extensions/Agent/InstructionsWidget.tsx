import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';

class InstructionsWidget extends ReactWidget {
    render(): JSX.Element {
        return (
            <div style={{ padding: '10px', backgroundColor: 'var(--jp-layout-color1)', minHeight: '100%' }}>
                <h1>Agent</h1>
                <p>hello world</p>
                <p>Please note, by using agentic workflows, you are giving the Mito Agent to run code on your behalf.</p>
            </div>
        );
    }
}

export default InstructionsWidget;