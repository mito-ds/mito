/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker, MainAreaWidget } from '@jupyterlab/apputils';
import { SettingsWidget } from './SettingsWidget';

export const COMMAND_MITO_AI_SETTINGS = 'mito-ai:open-settings';

/**
 * Initialization data for the mito settings extension.
 */
const SettingsManagerPlugin: JupyterFrontEndPlugin<WidgetTracker> = {
    id: 'mito-ai:settings-manager',
    description: 'Mito AI settings manager',
    autoStart: true,
    requires: [ICommandPalette],
    optional: [ILayoutRestorer],
    activate: _activate
}

function _activate(
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer | null
): WidgetTracker {
    // Create a widget creator function
    const newWidget = (): MainAreaWidget => {
        const content = new SettingsWidget();
        const widget = new MainAreaWidget({ content });
        widget.id = 'mito-ai-settings';
        widget.title.label = 'Mito AI Settings';
        widget.title.closable = true;
        return widget;
    };

    let widget = newWidget();

    // Add an application command
    app.commands.addCommand(COMMAND_MITO_AI_SETTINGS, {
        label: 'Mito AI Settings',
        execute: () => {
            // Create the widget if it doesn't exist or is disposed
            if (!widget || widget.isDisposed) {
                widget = newWidget();
            }

            // Add the widget to the tracker if not already there
            if (!tracker.has(widget)) {
                void tracker.add(widget);
            }

            // Add the widget to the app if not already attached
            if (!widget.isAttached) {
                void app.shell.add(widget, 'main');
            }

            // Activate the widget
            app.shell.activateById(widget.id);
        }
    });

    // Add the command to the palette
    palette.addItem({
        command: COMMAND_MITO_AI_SETTINGS,
        category: 'Mito AI'
    });

    // Track and restore the widget state
    const tracker = new WidgetTracker<MainAreaWidget>({
        namespace: widget.id
    });

    if (!tracker.has(widget)) {
        void tracker.add(widget);
    }

    if (restorer) {
        restorer.add(widget, 'mito-ai-settings');
    }

    return tracker;
}

export default SettingsManagerPlugin;