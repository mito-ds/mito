
import { ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { WidgetTracker } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { AgentWidget, buildAgentWidget } from './AgentWidget';
import { COMMAND_MITO_AI_OPEN_AGENT } from '../../commands';

const AgentPlugin: JupyterFrontEndPlugin<WidgetTracker> = {
    id: 'mito-ai:agent',
    description: 'Agentic workflows for JupyterLab',
    autoStart: true,
    requires: [ILauncher],
    optional: [ILayoutRestorer],
    activate: (
        app: JupyterFrontEnd,
        launcher: ILauncher,
        restorer: ILayoutRestorer | null
    ) => {
        console.log('AgentPlugin activated');

        // Define a widget creator function,
        // then call it to make a new widget
        const newWidget = () => {
            // Create a blank content widget inside of a MainAreaWidget
            const agentWidget = buildAgentWidget(
                app,
            );
            return agentWidget;
        };

        let widget = newWidget();

        // Add the command to the command registry
        app.commands.addCommand(COMMAND_MITO_AI_OPEN_AGENT, {
            label: 'Mito AI Agent',
            execute: (args?: ReadonlyPartialJSONObject) => {
                // In order for the widget to be accessible, the widget must be:
                // 1. Created
                // 2. Added to the widget tracker
                // 3. Attatched to the frontend

                // Step 1: Create the widget if its not already created
                if (!widget || widget.isDisposed) {
                    widget = newWidget();
                }

                // Step 2: Add the widget to the widget tracker if
                // its not already there
                if (!tracker.has(widget)) {
                    tracker.add(widget);
                }

                // Step 3: Attatch the widget to the app if its not
                // already there
                if (!widget.isAttached) {
                    app.shell.add(widget, 'left', { rank: 2000 });
                }

                // Now that the widget is potentially accessible, activating the
                // widget opens the taskpane
                app.shell.activateById(widget.id);


                // If the command is called with focus on chat input set to false, 
                // don't focus. This is useful when we don't want to active cell 
                // preview to be displayed when using the smart debugger.
                if (args?.focusChatInput === false) {
                    return;
                }

                // Set focus on the chat input
                const chatInput: HTMLTextAreaElement | null =
                    widget.node.querySelector('.chat-input');
                chatInput?.focus();
            }

        });

        // Add the launcher item
        launcher.add({
            command: COMMAND_MITO_AI_OPEN_AGENT,
            category: 'Notebook',
            rank: 1,
        });

        // Track and restore the widget state
        const tracker = new WidgetTracker<AgentWidget>({
            namespace: widget.id,
        });
        if (!tracker.has(widget)) {
            tracker.add(widget);
        }

        if (restorer) {
            restorer.add(widget, 'mito_ai');
        }

        // This allows us to force plugin load order
        console.log("mito-ai: AgentPlugin activated");
        return tracker;

    }
};

export default AgentPlugin;
