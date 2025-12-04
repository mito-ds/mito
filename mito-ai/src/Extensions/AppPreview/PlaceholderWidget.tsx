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
    container.style.alignItems = 'flex-start';
    container.style.justifyContent = 'center';
    container.style.height = '100%';
    container.style.width = '100%';
    container.style.padding = '20px';
    
    const emojiContainer = document.createElement('div');
    emojiContainer.style.fontSize = '80px';
    emojiContainer.style.textAlign = 'left';
    emojiContainer.style.minHeight = '100px';
    emojiContainer.style.display = 'flex';
    emojiContainer.style.alignItems = 'center';
    emojiContainer.style.justifyContent = 'flex-start';
    
    const emojis = ['🚧', '🏗️', '🚀'] as const;
    let currentEmojiIndex = 0;
    emojiContainer.textContent = emojis[currentEmojiIndex] ?? '';
    
    const emojiInterval = setInterval(() => {
      currentEmojiIndex = (currentEmojiIndex + 1) % emojis.length;
      emojiContainer.textContent = emojis[currentEmojiIndex] ?? '';
    }, 500);
    
    // Clean up interval when widget is disposed
    this.disposed.connect(() => {
      clearInterval(emojiInterval);
    });
    
    const message = document.createElement('div');
    message.textContent = 'Building your app. Depending on the size of your notebook, this might take a couple of minutes.';
    message.style.fontSize = '16px';
    message.style.color = 'var(--jp-content-font-color1)';
    message.style.marginTop = '20px';
    
    container.appendChild(emojiContainer);
    container.appendChild(message);
    this.node.appendChild(container);
  }
}

