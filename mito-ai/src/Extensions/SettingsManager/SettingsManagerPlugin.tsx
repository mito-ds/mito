/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker, MainAreaWidget } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { SettingsWidget } from './SettingsWidget';
import { IVerifiedReportsDeepLink } from './verifiedReports/VerifiedReportsPage';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import { COMMAND_MITO_AI_OPEN_SETTINGS_VERIFIED_REPORTS } from '../../commands';

const SETTINGS_WIDGET_ID = 'mito-ai-settings';

function getNotebookIdBeforeSettings(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker
): string | null {
    const current = app.shell.currentWidget;
    if (current instanceof NotebookPanel) {
        return current.id;
    }
    return notebookTracker.currentWidget?.id ?? null;
}

export const COMMAND_MITO_AI_SETTINGS = 'mito-ai:open-settings';
export const COMMAND_MITO_AI_SETTINGS_SUBSCRIPTION = 'mito-ai:open-settings-subscription';
export const COMMAND_MITO_AI_SETTINGS_DATABASE = 'mito-ai:open-settings-database';

type SettingsTab = 'database' | 'mcp' | 'general' | 'subscription' | 'rules' | 'verifiedReports' | 'profiler' | 'support';

/**
 * Initialization data for the mito settings extension.
 */
const SettingsManagerPlugin: JupyterFrontEndPlugin<WidgetTracker> = {
    id: 'mito-ai:settings-manager',
    description: 'Mito AI settings manager',
    autoStart: true,
    requires: [ICommandPalette, IContextManager, INotebookTracker],
    optional: [ILayoutRestorer],
    activate: _activate
}

function _activate(
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    contextManager: IContextManager,
    notebookTracker: INotebookTracker,
    restorer: ILayoutRestorer | null
): WidgetTracker {
    let previousNotebookId: string | null = null;

    const closeSettings = (): void => {
        const notebookId = previousNotebookId;
        if (widget && !widget.isDisposed) {
            widget.close();
        }
        if (notebookId) {
            app.shell.activateById(notebookId);
        }
    };

    // Create a widget creator function
    const newWidget = (initialTab?: SettingsTab, deepLink?: IVerifiedReportsDeepLink): MainAreaWidget => {
        const content = new SettingsWidget(contextManager, initialTab, closeSettings, deepLink);
        const widget = new MainAreaWidget({ content });
        widget.id = SETTINGS_WIDGET_ID;
        widget.title.label = 'Mito AI Settings';
        widget.title.closable = true;
        return widget;
    };

    let widget = newWidget();

    // Track and restore the widget state
    const tracker = new WidgetTracker<MainAreaWidget>({
        namespace: widget.id
    });

    // Reusable function to open settings with a specific tab
    const openSettingsWithTab = (initialTab?: SettingsTab, deepLink?: IVerifiedReportsDeepLink): void => {
        if (app.shell.currentWidget?.id !== SETTINGS_WIDGET_ID) {
            previousNotebookId = getNotebookIdBeforeSettings(app, notebookTracker);
        }

        // Dispose the old widget and create a new one with the specified tab
        if (widget && !widget.isDisposed) {
            widget.dispose();
        }
        widget = newWidget(initialTab, deepLink);

        // Add the widget to the tracker
        if (!tracker.has(widget)) {
            void tracker.add(widget);
        }

        // Add the widget to the app
        if (!widget.isAttached) {
            void app.shell.add(widget, 'main');
        }

        // Activate the widget
        app.shell.activateById(widget.id);
    };

    // Add an application command
    app.commands.addCommand(COMMAND_MITO_AI_SETTINGS, {
        label: 'Mito AI Settings',
        execute: () => {
            openSettingsWithTab();
        }
    });

    // Add the command to the palette
    palette.addItem({
        command: COMMAND_MITO_AI_SETTINGS,
        category: 'Mito AI'
    });

    // Add a command to open settings with the subscription tab
    app.commands.addCommand(COMMAND_MITO_AI_SETTINGS_SUBSCRIPTION, {
        label: 'Mito AI Settings: Subscription',
        execute: () => {
            openSettingsWithTab('subscription');
        }
    });

    // Add a command to open setting with the database tab
    app.commands.addCommand(COMMAND_MITO_AI_SETTINGS_DATABASE, {
        label: 'Mito AI Settings: Database',
        execute: () => {
            openSettingsWithTab('database');
        }
    });

    app.commands.addCommand(COMMAND_MITO_AI_OPEN_SETTINGS_VERIFIED_REPORTS, {
        label: 'Mito AI Settings: Verified Reports',
        execute: (args?: { reportName?: string; snippetId?: string }) => {
            openSettingsWithTab('verifiedReports', {
                reportName: args?.reportName,
                snippetId: args?.snippetId,
            });
        }
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