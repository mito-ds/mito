/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Rectangle selection coordinates
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Manages rectangle selection UI over Streamlit iframe
 */
export class SelectionOverlay {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private currentRect: Rectangle | null = null;
  private enabled = false;

  constructor(
    private containerElement: HTMLElement,
    private onSelectionComplete: (rect: Rectangle) => void
  ) {
    this.createCanvas();
    this.setupEventListeners();
  }

  /**
   * Create transparent canvas overlay
   */
  private createCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'streamlit-selection-overlay';
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      pointer-events: none;
      background: transparent;
    `;
    
    this.containerElement.appendChild(this.canvas);
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = context;
    
    // Set canvas size to match container
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const rect = this.containerElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /**
   * Enable/disable selection mode
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    this.canvas.style.cursor = enabled ? 'crosshair' : 'default';
    
    if (!enabled) {
      this.clearCanvas();
      this.currentRect = null;
    }
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    // Also support touch for tablets
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.enabled) return;
    
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    
    // Clear any previous selection
    this.clearCanvas();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.enabled || !this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    // Update current rectangle (normalized coordinates)
    this.currentRect = {
      x: Math.min(this.startX, currentX),
      y: Math.min(this.startY, currentY),
      width: Math.abs(currentX - this.startX),
      height: Math.abs(currentY - this.startY)
    };
    
    this.drawRectangle();
  }

  private handleMouseUp(e: MouseEvent): void {
    if (!this.enabled || !this.isDrawing) return;
    
    this.isDrawing = false;
    
    // Only emit if rectangle has meaningful size (>10px)
    if (this.currentRect && 
        this.currentRect.width > 10 && 
        this.currentRect.height > 10) {
      this.onSelectionComplete(this.currentRect);
    } else {
      this.clearCanvas();
      this.currentRect = null;
    }
  }

  // Touch event handlers (mirror mouse events)
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    this.handleMouseDown({
      clientX: touch.clientX,
      clientY: touch.clientY
    } as MouseEvent);
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    this.handleMouseMove({
      clientX: touch.clientX,
      clientY: touch.clientY
    } as MouseEvent);
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.handleMouseUp({} as MouseEvent);
  }

  /**
   * Draw the selection rectangle on canvas
   */
  private drawRectangle(): void {
    this.clearCanvas();
    
    if (!this.currentRect) return;
    
    const { x, y, width, height } = this.currentRect;
    
    // Draw semi-transparent fill
    this.ctx.fillStyle = 'rgba(255, 0, 255, 0.1)'; // Pink tint
    this.ctx.fillRect(x, y, width, height);
    
    // Draw dashed border
    this.ctx.strokeStyle = '#FF00FF'; // Magenta
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 4]);
    this.ctx.strokeRect(x, y, width, height);
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Get current rectangle coordinates
   */
  public getCurrentRect(): Rectangle | null {
    return this.currentRect;
  }

  /**
   * Clear selection and reset
   */
  public clearSelection(): void {
    this.clearCanvas();
    this.currentRect = null;
    this.isDrawing = false;
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.canvas.remove();
  }
}
