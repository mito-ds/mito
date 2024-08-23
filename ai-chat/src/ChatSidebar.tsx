import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import Chat from './Chat';


export function buildChatSidebar() {
    const chatWidget = ReactWidget.create(<Chat />) 
    chatWidget.id = 'ai-chat';
    chatWidget.title.label = 'AI Chat';
    // chatWidget.title.icon = chatIcon; TODO: Add an Icon
    chatWidget.title.caption = 'AI Chat for your JupyterLab';
    chatWidget.addClass('chat-widget');
    return chatWidget;
}

