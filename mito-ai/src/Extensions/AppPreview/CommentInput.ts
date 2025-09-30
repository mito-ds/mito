/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Rectangle } from './SelectionOverlay';

/**
 * Comment input box that appears near selection
 */
export class CommentInput {
  private container!: HTMLDivElement;
  private textarea!: HTMLTextAreaElement;
  private submitButton!: HTMLButtonElement;
  private cancelButton!: HTMLButtonElement;
  private loadingSpinner!: HTMLDivElement;

  constructor(
    private parentElement: HTMLElement,
    private rect: Rectangle,
    private onSubmit: (comment: string) => Promise<void>,
    private onCancel: () => void
  ) {
    this.createUI();
    this.positionNearSelection();
  }

  private createUI(): void {
    // Main container
    this.container = document.createElement('div');
    this.container.className = 'streamlit-comment-input';
    this.container.style.cssText = `
      position: absolute;
      background: #1E1E1E;
      border: 2px solid #FF00FF;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      z-index: 1001;
      min-width: 300px;
      max-width: 500px;
    `;

    // Textarea
    this.textarea = document.createElement('textarea');
    this.textarea.placeholder = 'Describe your change...';
    this.textarea.style.cssText = `
      width: 100%;
      min-height: 80px;
      background: #2D2D2D;
      color: #FFFFFF;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      resize: vertical;
      margin-bottom: 8px;
      box-sizing: border-box;
    `;
    this.textarea.focus();

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    `;

    // Cancel button
    this.cancelButton = document.createElement('button');
    this.cancelButton.textContent = 'Cancel';
    this.cancelButton.style.cssText = `
      padding: 6px 12px;
      background: #444;
      color: #FFF;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    `;
    this.cancelButton.onclick = () => this.handleCancel();

    // Submit button
    this.submitButton = document.createElement('button');
    this.submitButton.textContent = 'Send to AI';
    this.submitButton.style.cssText = `
      padding: 6px 12px;
      background: #FF00FF;
      color: #FFF;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    `;
    this.submitButton.onclick = () => this.handleSubmit();

    // Loading spinner (hidden by default)
    this.loadingSpinner = document.createElement('div');
    this.loadingSpinner.textContent = 'Processing...';
    this.loadingSpinner.style.cssText = `
      display: none;
      text-align: center;
      color: #FF00FF;
      font-size: 12px;
      margin-top: 8px;
    `;

    // Assemble
    buttonContainer.appendChild(this.cancelButton);
    buttonContainer.appendChild(this.submitButton);
    this.container.appendChild(this.textarea);
    this.container.appendChild(buttonContainer);
    this.container.appendChild(this.loadingSpinner);
    this.parentElement.appendChild(this.container);

    // Keyboard shortcuts
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.handleSubmit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.handleCancel();
      }
    });
  }

  /**
   * Position the comment box near the selection
   * Try to place it to the right, or below if not enough space
   */
  private positionNearSelection(): void {
    const parentRect = this.parentElement.getBoundingClientRect();
    const boxWidth = 320; // Approximate width
    const boxHeight = 150; // Approximate height
    const margin = 10;

    let left = this.rect.x + this.rect.width + margin;
    let top = this.rect.y;

    // If not enough space on the right, place below
    if (left + boxWidth > parentRect.width) {
      left = this.rect.x;
      top = this.rect.y + this.rect.height + margin;
    }

    // If not enough space below, place above
    if (top + boxHeight > parentRect.height) {
      top = Math.max(margin, this.rect.y - boxHeight - margin);
    }

    // Ensure it stays within bounds
    left = Math.max(margin, Math.min(left, parentRect.width - boxWidth - margin));
    top = Math.max(margin, Math.min(top, parentRect.height - boxHeight - margin));

    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
  }

  private async handleSubmit(): Promise<void> {
    const comment = this.textarea.value.trim();
    
    if (!comment) {
      this.textarea.focus();
      return;
    }

    // Show loading state
    this.setLoading(true);

    try {
      await this.onSubmit(comment);
      this.dispose();
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Failed to process request. Please try again.');
      this.setLoading(false);
    }
  }

  private handleCancel(): void {
    this.onCancel();
    this.dispose();
  }

  private setLoading(loading: boolean): void {
    this.textarea.disabled = loading;
    this.submitButton.disabled = loading;
    this.cancelButton.disabled = loading;
    this.loadingSpinner.style.display = loading ? 'block' : 'none';
    
    if (loading) {
      this.submitButton.textContent = 'Processing...';
    } else {
      this.submitButton.textContent = 'Send to AI';
    }
  }

  public dispose(): void {
    this.container.remove();
  }
}
