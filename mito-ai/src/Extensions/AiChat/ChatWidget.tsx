import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import ChatTaskpane from './ChatTaskpane';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { LabIcon } from '@jupyterlab/ui-components';
import chatIconSvg from '../../../src/icons/ChatIcon.svg'
import { IVariableManager } from '../VariableManager/VariableManagerPlugin';
import { JupyterFrontEnd } from '@jupyterlab/application';

export const chatIcon = new LabIcon({
    name: 'mito_ai',
    svgstr: chatIconSvg
});

export function buildChatWidget(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    rendermime: IRenderMimeRegistry,
    variableManager: IVariableManager
) {
    
    const chatWidget = ReactWidget.create(
        <ChatTaskpane 
            app={app}
            notebookTracker={notebookTracker}
            rendermime={rendermime}
            variableManager={variableManager}
        />
    ) 
    chatWidget.id = 'mito_ai';
    chatWidget.title.icon = chatIcon;
    chatWidget.title.caption = 'AI Chat for your JupyterLab';
    return chatWidget;
}