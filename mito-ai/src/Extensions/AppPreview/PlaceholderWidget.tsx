/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Widget } from '@lumino/widgets';

/**
 * Simple placeholder widget for loading state.
 */
export class PlaceholderWidget extends Widget {
  constructor() {
    super();
    this.addClass('jp-placeholder-widget');
    
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.height = '100%';
    container.style.width = '100%';
    container.style.padding = '40px 20px';
    container.style.textAlign = 'center';
    
    const emojiContainer = document.createElement('div');
    emojiContainer.style.fontSize = '64px';
    emojiContainer.style.minHeight = '80px';
    emojiContainer.style.display = 'flex';
    emojiContainer.style.alignItems = 'center';
    emojiContainer.style.justifyContent = 'center';
    emojiContainer.style.marginBottom = '24px';
    emojiContainer.style.transition = 'opacity 0.3s ease-in-out';
    
    const emojis = ['🚧', '🧱', '🏗️', '🔨', '🔧', '⚙️', '🛠️', '🔩', '📐'] as const;
    let currentEmojiIndex = 0;
    emojiContainer.textContent = emojis[currentEmojiIndex] ?? '';
    
    const emojiInterval = setInterval(() => {
      emojiContainer.style.opacity = '0';
      setTimeout(() => {
        currentEmojiIndex = (currentEmojiIndex + 1) % emojis.length;
        emojiContainer.textContent = emojis[currentEmojiIndex] ?? '';
        emojiContainer.style.opacity = '1';
      }, 150);
    }, 2000);
    
    const message = document.createElement('div');
    message.textContent = 'Building your app. This might take a couple of minutes.';
    message.style.fontSize = '16px';
    message.style.fontWeight = '500';
    message.style.color = 'var(--jp-content-font-color1)';
    message.style.marginBottom = '12px';
    message.style.textAlign = 'center';
    message.style.lineHeight = '1.5';
    
    const statusMessages = [
      'Starting build...',
      'Processing cells...',
      'Analyzing notebook structure...',
      'Converting to Streamlit format...',
      'Configuring app components...',
      'Evaluating Streamlit Apps...',
      'Initializing server...',
      'Almost there...',
      'Finalizing your app...',
      'Preparing preview...'
    ];
    
    const statusMessage = document.createElement('div');
    let currentStatusIndex = 0;
    statusMessage.textContent = statusMessages[currentStatusIndex] ?? '';
    statusMessage.style.fontSize = '13px';
    statusMessage.style.color = 'var(--jp-content-font-color3)';
    statusMessage.style.textAlign = 'center';
    statusMessage.style.lineHeight = '1.4';
    statusMessage.style.transition = 'opacity 0.2s ease-in-out';
    
    const statusInterval = setInterval(() => {
      statusMessage.style.opacity = '0';
      setTimeout(() => {
        currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
        statusMessage.textContent = statusMessages[currentStatusIndex] ?? '';
        statusMessage.style.opacity = '1';
      }, 200);
    }, 20000);
    
    // Clean up intervals when widget is disposed
    this.disposed.connect(() => {
      clearInterval(emojiInterval);
      clearInterval(statusInterval);
    });
    
    container.appendChild(emojiContainer);
    container.appendChild(message);
    container.appendChild(statusMessage);
    this.node.appendChild(container);
  }
}

