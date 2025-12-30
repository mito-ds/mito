/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';

/**
 * A simple empty widget for the Chart Wizard panel.
 */
export class ChartWizardWidget extends ReactWidget {
    constructor() {
        super();
        this.addClass('chart-wizard-widget');
    }

    render(): React.ReactElement {
        return (
            <div>
                <h2>Chart Wizard</h2>
                <p>Chart Wizard panel content will go here.</p>
            </div>
        );
    }
}