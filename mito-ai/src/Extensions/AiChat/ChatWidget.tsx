import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import ChatTaskpane from './ChatTaskpane';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { LabIcon } from '@jupyterlab/ui-components';
import chatIconSvg from '../../../src/icons/ChatIcon.svg'
import { IVariableManager } from '../VariableManager/VariableManagerPlugin';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getOperatingSystem } from '../../utils/user';
import { ICellManager } from '../CellManager/CellManagerPlugin';

export const chatIcon = new LabIcon({
    name: 'mito_ai',
    svgstr: chatIconSvg
});

export function buildChatWidget(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    rendermime: IRenderMimeRegistry,
    variableManager: IVariableManager,
    cellManager: ICellManager
) {

    // Get the operating system here so we don't have to do it each time the chat changes.
    // The operating system won't change, duh. 
    const operatingSystem = getOperatingSystem()
    
    const chatWidget = ReactWidget.create(
        <ChatTaskpane 
            app={app}
            notebookTracker={notebookTracker}
            renderMimeRegistry={rendermime}
            variableManager={variableManager}
            cellManager={cellManager}
            operatingSystem={operatingSystem}
        />
    ) 
    chatWidget.id = 'mito_ai';
    chatWidget.title.icon = chatIcon;
    chatWidget.title.caption = 'AI Chat for your JupyterLab';
    return chatWidget;
}